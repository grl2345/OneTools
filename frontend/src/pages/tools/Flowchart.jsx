import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";
import { aiFlowchart } from "../../api/client";

let mermaidPromise = null;
async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        fontFamily:
          "-apple-system,BlinkMacFontMacFont,'SF Pro Display','Inter',sans-serif",
        flowchart: { curve: "basis", padding: 14 },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

const EXAMPLES_ZH = [
  "用户注册流程：填写手机号 → 发送验证码 → 验证 → 设置密码 → 完成",
  "商品下单逻辑：加入购物车 → 结算 → 选择地址 → 选择支付 → 支付成功或失败分支 → 订单状态更新",
  "代码审查流程：提交 PR → 触发 CI → CI 通过后请求人评审 → 评审通过合并，否则返工",
];
const EXAMPLES_EN = [
  "User registration: enter phone number → send OTP → verify → set password → done",
  "Order placement: add to cart → checkout → choose address → select payment → success or failure branch → update order status",
  "Code review flow: open PR → trigger CI → if CI passes request review → merge on approval, otherwise revise",
];

export default function Flowchart() {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const svgRef = useRef(null);
  const seqRef = useRef(0);

  const lang = i18n.language || "zh";
  const examples = lang === "zh" ? EXAMPLES_ZH : EXAMPLES_EN;

  const renderMermaid = async (code) => {
    if (!code.trim()) {
      setSvg("");
      return;
    }
    setRendering(true);
    try {
      const mermaid = await getMermaid();
      const id = "mermaid-" + ++seqRef.current;
      const { svg } = await mermaid.render(id, code);
      setSvg(svg);
      setError(null);
    } catch (e) {
      setError(
        (lang === "zh" ? "图表渲染失败：" : "Render failed: ") +
          (e?.message || e)
      );
      setSvg("");
    } finally {
      setRendering(false);
    }
  };

  useEffect(() => {
    renderMermaid(mermaidCode);
    // eslint-disable-next-line
  }, [mermaidCode]);

  const generate = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setSvg("");
    try {
      const r = await aiFlowchart(q, lang);
      setMermaidCode(r.mermaid || "");
      setExplanation(r.explanation || "");
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "AI call failed");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (kind, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flowchart.svg";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPng = async () => {
    if (!svg) return;
    // Rasterize SVG through canvas at 2x for crisp output
    const img = new Image();
    const url =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(svg);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const w = img.naturalWidth * 2;
    const h = img.naturalHeight * 2;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "flowchart.png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  const panel = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
  };
  const panelHeader = {
    padding: "10px 14px",
    fontSize: 12,
    color: "var(--text-secondary)",
    fontWeight: 500,
    borderBottom: "1px solid var(--border-light)",
    background: "var(--bg-subtle)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    letterSpacing: -0.1,
  };
  const smallBtn = (active) => ({
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: active ? "var(--brand)" : "var(--bg-card)",
    color: active ? "#fff" : "var(--text-secondary)",
    fontSize: 11.5,
    fontWeight: 500,
    cursor: "pointer",
  });

  return (
    <>
      <SEO
        title={t("tools.flowchart.name")}
        description={t("tools.flowchart.desc")}
        path="/tools/flowchart"
        structuredData={schema.softwareApp({
          name: "OneTools AI Flowchart",
          description: t("tools.flowchart.desc"),
          url: "https://onetools.dev/tools/flowchart",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.flowchart.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {" "}·AI
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.flowchart.desc")}
          </p>
        </div>

        {/* Prompt + generate */}
        <div style={{ padding: "28px 0 14px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder={t("tools.flowchart.placeholder")}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-card)",
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <button
              onClick={generate}
              disabled={loading || !input.trim()}
              style={{
                padding: "12px 22px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background:
                  loading || !input.trim() ? "#d8d8e0" : "var(--gradient-brand)",
                color: "#fff",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                boxShadow:
                  loading || !input.trim()
                    ? "none"
                    : "0 4px 14px rgba(91,91,245,0.35)",
              }}
            >
              {loading ? t("tools.flowchart.generating") : "✦ " + t("tools.flowchart.generate")}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 2, alignSelf: "center" }}>
              {t("tools.flowchart.tryExample")}:
            </span>
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInput(ex)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "rgba(91,91,245,0.04)",
                  color: "var(--text-secondary)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  maxWidth: 360,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            marginBottom: 14, padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.25)",
            fontSize: 12.5, color: "var(--red)",
          }}>
            {error}
          </div>
        )}

        {explanation && (
          <div style={{
            marginBottom: 14, padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(91,91,245,0.06)",
            border: "1px solid rgba(91,91,245,0.2)",
            fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6,
          }}>
            <span style={{ color: "var(--brand)", marginRight: 6 }}>✦</span>
            {explanation}
          </div>
        )}

        {(mermaidCode || svg) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12, paddingBottom: 20 }}>
            {/* Mermaid source */}
            <div style={panel}>
              <div style={panelHeader}>
                <span>{t("tools.flowchart.source")}</span>
                <button
                  onClick={() => copyText("mermaid", mermaidCode)}
                  style={smallBtn(copied === "mermaid")}
                >
                  {copied === "mermaid" ? "✓ " + t("tools.flowchart.copied") : t("tools.flowchart.copy")}
                </button>
              </div>
              <textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: 420,
                  padding: 16,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  fontFamily: "var(--font-mono)",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Rendered diagram */}
            <div style={panel}>
              <div style={panelHeader}>
                <span>{t("tools.flowchart.preview")}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={downloadSvg} style={smallBtn(false)}>
                    ⬇ SVG
                  </button>
                  <button onClick={downloadPng} style={smallBtn(false)}>
                    ⬇ PNG
                  </button>
                </div>
              </div>
              <div
                ref={svgRef}
                style={{
                  padding: 20,
                  minHeight: 420,
                  overflow: "auto",
                  background: "repeating-conic-gradient(#f3f4f7 0 25%, #ffffff 0 50%) 0 0 / 18px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                dangerouslySetInnerHTML={{ __html: svg || (rendering ? "" : "") }}
              />
            </div>
          </div>
        )}

        {!mermaidCode && !loading && (
          <div style={{
            marginBottom: 72, padding: "18px 20px",
            borderRadius: "var(--radius)",
            background: "rgba(91,91,245,0.05)",
            border: "1px solid rgba(91,91,245,0.18)",
            fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65,
          }}>
            <div style={{ fontWeight: 600, color: "var(--brand)", marginBottom: 4 }}>
              ℹ︎ {t("tools.flowchart.howTitle")}
            </div>
            {t("tools.flowchart.howDesc")}
          </div>
        )}
      </div>
    </>
  );
}
