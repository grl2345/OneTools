# OneTools 部署指南（全 Vercel 方案）

前端和 AI 后端**统一跑在 Vercel 上**，无须 Railway / 其他托管平台。
AI 后端是 `frontend/api/` 下的 Vercel Edge Functions（Node.js / Edge Runtime）。

---

## 架构

```
                       ┌─────────────────────────────────────┐
浏览器 ── HTTPS ──►     │ Vercel（一个项目）                   │
                       │  ├─ 前端静态资源（Vite build）         │
                       │  └─ /api/* Edge Functions             │
                       │       ├─ /api/ai/json/query           │
                       │       ├─ /api/ai/json/schema          │
                       │       └─ /api/ai/markdown/rewrite     │
                       └────────────────────┬────────────────┘
                                            ▼
                             Groq / OpenAI / SiliconFlow
                                （任选 OpenAI 协议兼容）
```

---

## Step 1 · 首次部署到 Vercel

1. 打开 https://vercel.com/new
2. 选 GitHub 仓库 `grl2345/OneTools` → 点 **Import**
3. **Root Directory** 改为 `frontend`
4. Framework Preset 会自动识别为 **Vite** —— 保持默认
5. 点 **Deploy**

首次部署不配 env vars 也能成功，但 AI 功能会返回 503 提示"Server not configured"。下一步填 Key。

---

## Step 2 · 配置 API Key（必须）

1. 进入 Vercel 项目 → **Settings** → **Environment Variables**
2. 添加以下三个（作用域默认全选 Production / Preview / Development）：

| Name | Value | 备注 |
|---|---|---|
| `OPENAI_API_KEY` | `gsk_你的Groq密钥` | Groq 控制台创建 |
| `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` | 换 SiliconFlow 就写它的地址 |
| `OPENAI_MODEL` | `llama-3.3-70b-versatile` | 按模型服务商换 |

3. **Settings → Deployments** 找到最新部署 → 右上角 **⋯** → **Redeploy**（不勾 "Use existing Build Cache"）→ 让新 env 生效

> Vercel 改完 env 不会自动重新部署，**必须手动 Redeploy 一次**。

---

## Step 3 · 验证

在你的 Vercel 域名（如 `onetools-xxx.vercel.app`）测：

| 工具 | 预期 |
|---|---|
| `/api/health` | `{"status":"ok"}`（任何时候都该返回） |
| 时间戳转换 · 自然语言 | 本地 chrono-node，不需要 Key 就能用 |
| JSON 自然语言查询 | 返回 expression + result + 解释 |
| JSON Schema 推断 | 返回字段字典表格 |
| Markdown 改写 | 选中段落被替换为改写版 |

---

## 切换模型服务

只要对方**兼容 OpenAI Chat Completions 协议**，改 Vercel env 两个变量即可，代码不用动：

| 服务 | `OPENAI_BASE_URL` | 推荐 Model | 免费额度 |
|---|---|---|---|
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | 14k req/day |
| **SiliconFlow** | `https://api.siliconflow.cn/v1` | `Qwen/Qwen2.5-72B-Instruct` | 14 元试用 |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct:free` | 有免费模型 |
| **OpenAI 原生** | `https://api.openai.com/v1` | `gpt-4o-mini` | 付费 |

> ⚠️ Groq 的模型 Key 必须要开启 JSON mode。`llama-3.3-70b-versatile` 支持，`llama-guard` 系列不支持。

---

## 本地开发

### 场景 A · 不需要调试 AI 功能
直接 `npm run dev` 即可，页面照跑。AI 接口会 503，时间戳 / 图片 / Markdown 预览等**纯前端**工具不受影响。

```bash
cd frontend
npm install
npm run dev
# 打开 http://localhost:3000
```

### 场景 B · 需要本地调试 AI
用 Vercel CLI 在本地把 Edge Functions 和 Vite 一起跑起来：

```bash
# 一次性装 CLI
npm i -g vercel

# 关联本地到 Vercel 项目（第一次问几个问题，一路回车）
cd frontend
vercel link

# 把 Vercel 上的 env 变量拉到本地（生成 .env.local）
vercel env pull

# 启动开发服务器（同时跑 Vite + Edge Functions）
vercel dev
# 打开 http://localhost:3000
```

`vercel dev` 会用你的 Vercel env 真跑 API 调用，所以能本地试 AI。

---

## 常见问题

### Q1. AI 返回 503 `Server not configured`
Vercel 的 env 没配 `OPENAI_API_KEY`，或者配了但没 Redeploy。按 Step 2 手动触发一次新部署。

### Q2. AI 返回 502 `LLM HTTP 401`
Key 写错了（复制时带了空格 / 前缀错 / 用错了服务商的 Key）。重新去 Groq 创建一个新 Key 粘贴进 Vercel。

### Q3. AI 返回 502 `LLM HTTP 429`
速率超限。免费档 Groq 每分钟 30 次，JSON Schema 这种单次大请求更容易触发。稍等再试，或换模型。

### Q4. 返回 502 `LLM content is not valid JSON`
换的模型不支持 JSON mode。改用 `llama-3.3-70b-versatile` 或 `qwen2.5-72b-instruct` 这类明确支持 response_format 的模型。

### Q5. 构建失败 `Module not found: api/...`
检查 `frontend/api/` 目录结构，文件名必须是 `.js`，路径对应 URL 路径（如 `api/ai/json/query.js` → `/api/ai/json/query`）。

---

## 文件约定

```
frontend/
├── api/                          ← Vercel Edge Functions
│   ├── _lib/
│   │   └── llm.js                ← 共享 LLM 调用辅助
│   ├── health.js                 ← /api/health
│   └── ai/
│       ├── json/
│       │   ├── query.js          ← /api/ai/json/query
│       │   └── schema.js         ← /api/ai/json/schema
│       └── markdown/
│           └── rewrite.js        ← /api/ai/markdown/rewrite
├── src/                          ← React 前端
└── vercel.json                   ← 留空占位，保留 $schema
```

下划线开头的目录（如 `_lib`）不会被 Vercel 暴露为 URL 路由，专用于共享代码。
