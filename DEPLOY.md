# OneTools 部署指南

前端：Vercel（静态站） · 后端：Railway（FastAPI 容器）  
AI 提供方：Groq / OpenAI / SiliconFlow 任选（OpenAI 协议兼容即可）

---

## 架构

```
                          ┌────────────────────────┐
浏览器 ── HTTPS ──►  Vercel │ 前端静态资源 (Vite build) │
                          │ /api/* 透明转发 (rewrite) │
                          └────────────┬───────────┘
                                       ▼
                          ┌────────────────────────┐
                          │ Railway · FastAPI       │
                          │ /api/ai/parse-time      │
                          │ /api/ai/json/query      │
                          │ /api/ai/json/schema     │
                          │ /api/ai/markdown/rewrite│
                          └────────────┬───────────┘
                                       ▼
                                  Groq API
```

浏览器看到的永远是同一个域名（Vercel），不需要 CORS。

---

## Step 1 · 部署后端到 Railway

1. 打开 https://railway.app/new
2. 选 **Deploy from GitHub repo** → 授权并选 `grl2345/OneTools`
3. 进入项目后：
   - 顶部 ⚙️ **Settings** → **Source** → **Root Directory** 改为 `backend`
   - **Settings** → **Deploy** → **Start Command** 保持空白（`railway.json` 已定义）
4. **Variables** 标签添加三个环境变量：
   ```env
   OPENAI_API_KEY=gsk_你的Groq密钥
   OPENAI_BASE_URL=https://api.groq.com/openai/v1
   OPENAI_MODEL=llama-3.3-70b-versatile
   ```
   > Groq Key 的形式：`gsk_xxxxxxxxxx...`  
   > 用 SiliconFlow 就换对应的 `BASE_URL=https://api.siliconflow.cn/v1` 和模型名  
   > 用 OpenAI 原生把 Key 和 Model 换成 `sk-...` 与 `gpt-4o-mini`

5. Railway 会自动触发部署，约 2-3 分钟。完成后顶部会显示 **Active** 状态
6. **Settings** → **Networking** → **Generate Domain**  
   会得到一个类似 `onetools-production.up.railway.app` 的公开地址
7. 用浏览器访问 `https://你的后端域名/api/health` 应返回：
   ```json
   {"status":"ok"}
   ```
   → ✅ 后端已就绪

---

## Step 2 · 把 Railway 地址写到 vercel.json

编辑本仓库的 `frontend/vercel.json`，把占位域名替换成你在 Step 1 拿到的：

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://onetools-production.up.railway.app/api/:path*"
    }
  ]
}
```

然后提交推送：

```bash
git add frontend/vercel.json
git commit -m "chore: point /api/* rewrites to Railway backend"
git push origin main
```

Vercel 会监听到 push 自动重新部署前端，约 1 分钟完成。

---

## Step 3 · 部署前端到 Vercel（如果还没部署过）

如果前端已在 Vercel 跑了，Step 2 的 push 之后就自动更新，跳过这步。

首次部署：

1. 打开 https://vercel.com/new
2. 选 `grl2345/OneTools`
3. **Root Directory** 设为 `frontend`
4. Framework Preset 自动识别为 Vite，保持默认
5. 点 **Deploy**，约 1 分钟拿到 `xxx.vercel.app` 域名

---

## Step 4 · 验证

在前端页面上：

- 打开 **JSON 工具** → 粘贴任意合法 JSON → 切到 "Schema 推断" 点按钮  
  → 应该返回字段字典表格
- 打开 **Markdown 预览** → 选中一段文字 → 点 "简化" / "翻译"  
  → 选中区域应被改写
- 打开 **时间戳转换** → 输入 "下周五下午 3 点" → 点"解析"  
  → **这个用的是 chrono-node，不依赖后端，永远能用**

---

## 常见问题

### Q1 Railway 部署报 `ModuleNotFoundError: No module named 'app'`
Root Directory 没设成 `backend`，Railway 在仓库根找不到 `app/` 目录。在 Railway 的 Service Settings 里改 Root Directory 为 `backend`，触发 redeploy。

### Q2 访问 `/api/ai/...` 返回 404
说明 `vercel.json` 里的 rewrite destination 写错了或者没部署成功。
- 直接 `curl https://你的后端/api/health` 确认后端活着
- 然后检查 vercel.json 的 URL 有没有拼错

### Q3 AI 返回 500 `"AI call failed: ..."`
- Groq Key 没写进 Railway Variables，或者写错了 → 后端启动时没读到
- 或者你的 Groq 账号被限频 → 看 Railway Logs 标签具体报什么

### Q4 想换模型服务
只要对方**兼容 OpenAI Chat Completions 协议**，改 Railway 上的 `OPENAI_BASE_URL` 和 `OPENAI_MODEL` 两个变量，重启服务即可。LangChain 的代码不用动。

兼容清单：
- Groq · `https://api.groq.com/openai/v1` · `llama-3.3-70b-versatile`
- SiliconFlow · `https://api.siliconflow.cn/v1` · `Qwen/Qwen2.5-72B-Instruct`
- OpenRouter · `https://openrouter.ai/api/v1` · `openai/gpt-4o-mini`
- 官方 OpenAI · `https://api.openai.com/v1` · `gpt-4o-mini`

---

## 本地开发

同时跑前后端：

```bash
# Terminal 1 — 后端
cd backend
cp .env.example .env  # 填 OPENAI_* 三个变量
pip install -r requirements.txt
uvicorn app.main:app --reload
# http://localhost:8000/api/health

# Terminal 2 — 前端
cd frontend
npm install
npm run dev
# http://localhost:3000
```

Vite 配置里已经把 `/api/*` 代理到 `localhost:8000`，所以开发时 `vercel.json` 不生效，不会冲突。
