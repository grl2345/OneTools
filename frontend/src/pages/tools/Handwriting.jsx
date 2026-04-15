import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";
import { aiVision } from "../../api/client";
import { fileToDataUrl } from "../../utils/image";

export default function Handwriting() {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError(t("tools.handwriting.notImage")); return; }
    setError(null); setResult(null); setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const run = async () => {
    if (!file || loading) return;
    setError(null); setResult(null); setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file, 1800, 0.88);
      const r = await aiVision("handwriting", dataUrl, i18n.language || "zh");
      setResult(r);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "AI call failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setResult(null); setError(null);
  };

  const panel = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "var(--bg-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  return (
    <>
      <SEO
        title={t("tools.handwriting.name")}
        description={t("tools.handwriting.desc")}
        path="/tools/handwriting"
        structuredData={schema.softwareApp({
          name: "OneTools AI Handwriting OCR",
          description: t("tools.handwriting.desc"),
          url: "https://onetools.dev/tools/handwriting",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.handwriting.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> ·AI</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.handwriting.desc")}
          </p>
        </div>

        <input ref={inputRef} type="file" accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

        {!file ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            style={{
              marginTop: 28, padding: "80px 24px", textAlign: "center",
              borderRadius: "var(--radius)",
              border: `2px dashed ${dragging ? "var(--brand)" : "var(--border-strong)"}`,
              background: dragging ? "rgba(91,91,245,0.06)" : "var(--bg-card)",
              cursor: "pointer", boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {t("tools.handwriting.dropHere")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.handwriting.hint")}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: "24px 0 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }} />
              <button onClick={reset}
                style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                {t("tools.handwriting.replace")}
              </button>
              <button onClick={run} disabled={loading}
                style={{ padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none", background: loading ? "#d8d8e0" : "var(--gradient-brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", boxShadow: loading ? "none" : "0 4px 14px rgba(91,91,245,0.35)" }}>
                {loading ? t("tools.handwriting.recognizing") : "✦ " + t("tools.handwriting.recognize")}
              </button>
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingBottom: 20 }}>
              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.handwriting.original")}</span>
                </div>
                <div style={{ padding: 16, minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)" }}>
                  <img src={preview} alt="" style={{ maxWidth: "100%", maxHeight: 480, objectFit: "contain" }} />
                </div>
              </div>

              <div style={panel}>
                <div style={panelHeader}>
                  <span>
                    {t("tools.handwriting.recognized")}
                    {result?.language && <span style={{ marginLeft: 8, color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{result.language}</span>}
                    {result?.confidence && <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: result.confidence === "high" ? "rgba(16,185,129,0.12)" : result.confidence === "low" ? "rgba(245,158,11,0.12)" : "rgba(91,91,245,0.1)", color: result.confidence === "high" ? "var(--green)" : result.confidence === "low" ? "var(--amber)" : "var(--brand)" }}>
                      {result.confidence}
                    </span>}
                  </span>
                  {result?.text && (
                    <button onClick={copy} style={{
                      padding: "4px 10px", borderRadius: 999,
                      border: "1px solid var(--border)",
                      background: copied ? "rgba(16,185,129,0.1)" : "var(--bg-card)",
                      color: copied ? "var(--green)" : "var(--text-secondary)",
                      fontSize: 11, fontWeight: 500,
                    }}>
                      {copied ? "✓" : "⎘"}
                    </button>
                  )}
                </div>
                <div style={{ minHeight: 360, padding: 16, fontSize: 14, lineHeight: 1.75, color: "var(--text-primary)", whiteSpace: "pre-wrap", overflow: "auto", maxHeight: 560 }}>
                  {result?.text || (loading ? "..." : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("tools.handwriting.waiting")}</span>)}
                </div>
                {result?.notes && (
                  <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-light)", background: "var(--bg-subtle)", fontSize: 11.5, color: "var(--text-muted)" }}>
                    ℹ︎ {result.notes}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
