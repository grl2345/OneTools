import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";
import AiPanel from "../../components/AiPanel";
import { encodeBase64, decodeBase64 } from "../../utils/codec";

const btn = (active) => ({
  padding: "6px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: active ? "var(--text-primary)" : "#ffffff",
  color: active ? "#fff" : "var(--text-secondary)",
  fontSize: 12.5,
  fontWeight: 500,
  letterSpacing: -0.1,
  transition: "all 0.15s ease",
});

const panel = {
  background: "#ffffff",
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
  background: "#fafbfc",
  letterSpacing: -0.1,
};

function looksLikeBase64(s) {
  const trimmed = s.trim();
  if (!trimmed || trimmed.length < 4) return false;
  return /^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length % 4 === 0;
}

export default function Base64Tool() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("auto"); // "encode" | "decode" | "auto"
  const [copied, setCopied] = useState(false);

  const resolvedMode = useMemo(() => {
    if (mode !== "auto") return mode;
    return looksLikeBase64(input) ? "decode" : "encode";
  }, [input, mode]);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      if (resolvedMode === "encode") return { output: encodeBase64(input), error: null };
      return { output: decodeBase64(input), error: null };
    } catch (e) {
      return { output: "", error: e.message || "Conversion error" };
    }
  }, [input, resolvedMode]);

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const swap = () => setInput(output);

  return (
    <>
      <SEO
        title={t("tools.base64.name")}
        description={t("tools.base64.desc")}
        path="/tools/base64"
        structuredData={schema.softwareApp({
          name: "OneTools Base64",
          description: t("tools.base64.desc"),
          url: "https://onetools.dev/tools/base64",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.base64.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {" "}·AI
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.base64.desc")}
          </p>
        </div>

        <div style={{ padding: "24px 0 12px", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 4 }}>{t("tools.base64.mode")}:</span>
          {["auto", "encode", "decode"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={btn(mode === m)}>
              {t("tools.base64.mode_" + m)}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={swap} disabled={!output} style={{ ...btn(false), opacity: output ? 1 : 0.4 }}>
            ⇅ {t("tools.base64.swap")}
          </button>
          <button onClick={copy} style={btn(copied)}>
            {copied ? "✓ " + t("tools.base64.copied") : t("tools.base64.copy")}
          </button>
          <button onClick={() => setInput("")} style={btn(false)}>{t("tools.base64.clear")}</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingBottom: 18 }}>
          <div style={panel}>
            <div style={panelHeader}>
              {t("tools.base64.inputLabel")} · {input.length}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("tools.base64.placeholder")}
              spellCheck={false}
              style={{ width: "100%", minHeight: 300, padding: 16, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, lineHeight: "20px", resize: "vertical" }}
            />
          </div>
          <div style={{ ...panel, borderColor: error ? "rgba(239,68,68,0.35)" : "var(--border)" }}>
            <div style={panelHeader}>
              {resolvedMode === "encode" ? t("tools.base64.encoded") : t("tools.base64.decoded")} · {output.length}
            </div>
            {error ? (
              <div style={{ padding: 16, color: "var(--red)", fontSize: 13 }}>{error}</div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="—"
                style={{ width: "100%", minHeight: 300, padding: 16, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, lineHeight: "20px", resize: "vertical" }}
              />
            )}
          </div>
        </div>

        <div style={{ paddingBottom: 72 }}>
          <AiPanel
            tool="base64"
            content={resolvedMode === "decode" ? output : input}
            context={{ mode: resolvedMode }}
          />
        </div>
      </div>
    </>
  );
}
