import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { aiFixJson } from "../../api/client";

const SAMPLE_JSON = `{
  "name": "DevKit",
  "version": "1.0.0",
  "tools": [
    { "id": "json-formatter", "status": "live" },
    { "id": "regex-tester", "status": "coming-soon" }
  ],
  "config": {
    "theme": "light",
    "ai_fix": true
  }
}`;

const BROKEN_SAMPLES = [
  `{"name": "test", "items": [1, 2, 3,], "valid": true}`,
  `{name: "hello", 'age': 25, "active": True}`,
  `{"data": {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob",}]}}`,
];

function getJsonError(str) {
  try {
    JSON.parse(str);
    return null;
  } catch (e) {
    return e.message;
  }
}

function formatJson(str, indent = 2) {
  return JSON.stringify(JSON.parse(str), null, indent);
}

function getDepth(obj, d = 0) {
  if (typeof obj !== "object" || obj === null) return d;
  if (Array.isArray(obj))
    return obj.length ? Math.max(...obj.map((v) => getDepth(v, d + 1))) : d + 1;
  const vals = Object.values(obj);
  return vals.length ? Math.max(...vals.map((v) => getDepth(v, d + 1))) : d + 1;
}

function LineNumbers({ count }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 44,
        background: "var(--bg)",
        borderRight: "1px solid var(--border-light)",
        padding: "16px 0",
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: Math.max(count, 20) }, (_, i) => (
        <div
          key={i}
          style={{
            height: 20,
            lineHeight: "20px",
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "right",
            paddingRight: 12,
            fontFamily: "var(--font-mono)",
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function StatusPill({ valid, fixing, t }) {
  if (fixing)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          background: "var(--ai-purple-light)",
          color: "var(--ai-purple-text)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--ai-purple)",
            animation: "pulse 1s ease infinite",
          }}
        />
        {t("tools.jsonFormatter.aiFixing")}
      </span>
    );
  if (valid === null) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: valid ? "var(--accent-light)" : "var(--error-light)",
        color: valid ? "var(--accent-text)" : "var(--error-text)",
        fontFamily: "var(--font-mono)",
        transition: "all 0.3s",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: valid ? "var(--accent)" : "var(--error)",
        }}
      />
      {valid
        ? t("tools.jsonFormatter.validJson")
        : t("tools.jsonFormatter.invalidJson")}
    </span>
  );
}

export default function JsonFormatter() {
  const { t } = useTranslation();
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState(2);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [fixing, setFixing] = useState(false);
  const [fixes, setFixes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showFixes, setShowFixes] = useState(false);

  const processJson = useCallback((val, ind) => {
    if (!val.trim()) {
      setOutput("");
      setError(null);
      setIsValid(null);
      setFixes([]);
      setShowFixes(false);
      return;
    }
    const err = getJsonError(val);
    if (err) {
      setError(err);
      setIsValid(false);
      setOutput("");
    } else {
      setError(null);
      setIsValid(true);
      setFixes([]);
      setShowFixes(false);
      try {
        setOutput(formatJson(val, ind));
      } catch {
        setOutput(val);
      }
    }
  }, []);

  useEffect(() => {
    processJson(input, indent);
  }, [input, indent, processJson]);

  const handleAiFix = async () => {
    setFixing(true);
    setShowFixes(false);
    try {
      const result = await aiFixJson(input);
      setFixing(false);
      if (result.fixed_json) {
        setInput(result.fixed_json);
        setFixes(result.fixes || []);
        setShowFixes(true);
        processJson(result.fixed_json, indent);
      } else {
        setFixes(["error: " + (result.error || "Unknown error")]);
        setShowFixes(true);
      }
    } catch (e) {
      setFixing(false);
      setFixes(["error: " + (e.message || "Network error")]);
      setShowFixes(true);
    }
  };

  const handleMinify = () => {
    if (!isValid) return;
    try {
      setOutput(JSON.stringify(JSON.parse(input)));
    } catch {}
  };

  const handleCopy = () => {
    const text = output || input;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setIsValid(null);
    setFixes([]);
    setShowFixes(false);
  };

  const handleLoadSample = () => {
    const sample =
      BROKEN_SAMPLES[Math.floor(Math.random() * BROKEN_SAMPLES.length)];
    setInput(sample);
  };

  const inputLines = (input || "").split("\n").length;
  const outputLines = (output || "").split("\n").length;

  let stats = { size: 0, depth: "-" };
  try {
    const obj = JSON.parse(input);
    stats = {
      size: new Blob([input]).size,
      depth: getDepth(obj),
    };
  } catch {
    stats = { size: new Blob([input]).size, depth: "-" };
  }

  const btnStyle = (active) => ({
    padding: "6px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: active ? "var(--accent-light)" : "var(--bg-card)",
    color: active ? "var(--accent-text)" : "var(--text-secondary)",
    fontSize: 12.5,
    fontWeight: 500,
  });

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 28px" }}>
      {/* Header */}
      <div style={{ padding: "32px 0 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-sans)", letterSpacing: -0.5 }}>
            {t("tools.jsonFormatter.name")}
            <span style={{ color: "var(--accent)" }}> & Fixer</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
            {t("tools.jsonFormatter.desc")}
          </p>
        </div>
        <StatusPill valid={isValid} fixing={fixing} t={t} />
      </div>

      {/* Toolbar */}
      <div style={{ padding: "14px 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {[2, 4].map((n) => (
            <button key={n} onClick={() => setIndent(n)} style={btnStyle(indent === n)}>
              {n} {t("tools.jsonFormatter.spaces")}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
          <button onClick={handleMinify} disabled={!isValid} style={{ ...btnStyle(false), opacity: isValid ? 1 : 0.4, cursor: isValid ? "pointer" : "not-allowed" }}>
            {t("tools.jsonFormatter.minify")}
          </button>
          <button onClick={handleCopy} style={btnStyle(copied)}>
            {copied ? t("tools.jsonFormatter.copied") + " ✓" : t("tools.jsonFormatter.copy")}
          </button>
          <button onClick={handleClear} style={btnStyle(false)}>
            {t("tools.jsonFormatter.clear")}
          </button>
        </div>
        <button
          onClick={handleLoadSample}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px dashed var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          {t("tools.jsonFormatter.loadSample")} ↻
        </button>
      </div>

      {/* Editor */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingBottom: 20 }}>
        {/* Input Panel */}
        <div
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${isValid === false ? "rgba(232,89,60,0.3)" : "var(--border)"}`,
            borderRadius: "var(--radius)",
            overflow: "hidden",
            transition: "border-color 0.3s",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{t("tools.jsonFormatter.inputLabel")}</span>
            <span>{inputLines} {t("tools.jsonFormatter.lines")} · {stats.size}B</span>
          </div>
          <div style={{ position: "relative" }}>
            <LineNumbers count={inputLines} />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("tools.jsonFormatter.placeholder")}
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: 420,
                padding: "16px 16px 16px 52px",
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontSize: 13,
                lineHeight: "20px",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{t("tools.jsonFormatter.outputLabel")}</span>
            {isValid && (
              <span>
                {outputLines} {t("tools.jsonFormatter.lines")} · {t("tools.jsonFormatter.depth")} {stats.depth}
              </span>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <LineNumbers count={isValid ? outputLines : 1} />
            {isValid === false ? (
              <div style={{ padding: "24px 24px 24px 52px", minHeight: 420 }}>
                {/* Error */}
                <div
                  style={{
                    background: "var(--error-light)",
                    border: "1px solid rgba(232,89,60,0.2)",
                    borderRadius: "var(--radius-sm)",
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--error)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
                    ✕ {t("tools.jsonFormatter.parseError")}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--error-text)", fontFamily: "var(--font-mono)", lineHeight: 1.6, wordBreak: "break-word" }}>
                    {error}
                  </div>
                </div>

                {/* AI Fix */}
                <button
                  onClick={handleAiFix}
                  disabled={fixing}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(83,74,183,0.25)",
                    background: fixing
                      ? "linear-gradient(90deg, var(--ai-purple-light) 0%, rgba(83,74,183,0.15) 50%, var(--ai-purple-light) 100%)"
                      : "var(--ai-purple-light)",
                    backgroundSize: "200% 100%",
                    animation: fixing ? "shimmer 1.5s ease infinite" : "none",
                    color: "var(--ai-purple-text)",
                    cursor: fixing ? "wait" : "pointer",
                    fontSize: 14,
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {fixing ? (
                    <>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--ai-purple)", animation: "pulse 0.8s ease infinite" }} />
                      {t("tools.jsonFormatter.aiFixing")}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 16 }}>✦</span>
                      {t("tools.jsonFormatter.fixWithAi")}
                    </>
                  )}
                </button>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center", fontFamily: "var(--font-mono)" }}>
                  {t("tools.jsonFormatter.fixHint")}
                </p>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                style={{
                  width: "100%",
                  minHeight: 420,
                  padding: "16px 16px 16px 52px",
                  background: "transparent",
                  border: "none",
                  color: "#2d7a4f",
                  fontSize: 13,
                  lineHeight: "20px",
                  resize: "vertical",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* AI Fix Results */}
      {showFixes && fixes.length > 0 && (
        <div style={{ paddingBottom: 20, animation: "fadeIn 0.4s ease both" }}>
          <div
            style={{
              background: "var(--accent-light)",
              border: "1px solid rgba(29,158,117,0.2)",
              borderRadius: "var(--radius)",
              padding: "14px 20px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1, color: "var(--accent)" }}>✦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-text)", marginBottom: 6 }}>
                {t("tools.jsonFormatter.aiFixedCount", { count: fixes.length })}
              </div>
              {fixes.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--accent)", marginRight: 6 }}>→</span>
                  {t(`fixes.${f}`, f)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "20px 0" }}>
        {[
          { icon: "⚡", titleKey: "features.instant", descKey: "features.instantDesc" },
          { icon: "✦", titleKey: "features.aiFix", descKey: "features.aiFixDesc" },
          { icon: "◈", titleKey: "features.private", descKey: "features.privateDesc" },
          { icon: "∞", titleKey: "features.free", descKey: "features.freeDesc" },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              borderRadius: "var(--radius)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
              {t(f.titleKey)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {t(f.descKey)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
