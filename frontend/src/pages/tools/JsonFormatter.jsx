import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { aiFixJson } from "../../api/client";

const SAMPLE_JSON = `{
  "name": "OneTools",
  "version": "1.0.0",
  "tools": [
    { "id": "json-formatter", "status": "live" },
    { "id": "regex-tester", "status": "coming-soon" }
  ],
  "config": {
    "theme": "dark",
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
        width: 46,
        background: "rgba(3, 5, 10, 0.6)",
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
          {String(i + 1).padStart(2, "0")}
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
          gap: 8,
          padding: "5px 14px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: "var(--ai-purple-light)",
          color: "var(--ai-purple-text)",
          border: "1px solid rgba(139,125,255,0.35)",
          fontFamily: "var(--font-mono)",
          letterSpacing: 1,
          boxShadow: "inset 0 0 10px rgba(139,125,255,0.12)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--ai-purple)",
            boxShadow: "0 0 8px var(--ai-purple)",
            animation: "pulse 1s ease infinite",
          }}
        />
        {t("tools.jsonFormatter.aiFixing")}
      </span>
    );
  if (valid === null) return null;

  const color = valid ? "#10f4a8" : "#ff4d6d";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 14px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: `${color}12`,
        color: color,
        border: `1px solid ${color}40`,
        fontFamily: "var(--font-mono)",
        letterSpacing: 1,
        boxShadow: `inset 0 0 10px ${color}20`,
        transition: "all 0.3s",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
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
    border: active
      ? "1px solid rgba(0,229,255,0.5)"
      : "1px solid var(--border)",
    background: active
      ? "rgba(0,229,255,0.1)"
      : "rgba(14,20,36,0.6)",
    color: active ? "var(--accent-text)" : "var(--text-secondary)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
    boxShadow: active ? "inset 0 0 10px rgba(0,229,255,0.18)" : "none",
  });

  const panelStyle = (danger) => ({
    position: "relative",
    background:
      "linear-gradient(160deg, rgba(14,20,36,0.78) 0%, rgba(6,10,20,0.78) 100%)",
    border: `1px solid ${danger ? "rgba(255,77,109,0.35)" : "var(--border)"}`,
    borderRadius: "var(--radius)",
    overflow: "hidden",
    backdropFilter: "blur(6px)",
    boxShadow: danger
      ? "0 0 0 1px rgba(255,77,109,0.15), 0 0 28px rgba(255,77,109,0.08)"
      : "0 10px 30px rgba(0,0,0,0.45), inset 0 0 26px rgba(0,229,255,0.03)",
    transition: "all 0.3s",
  });

  const panelHeader = {
    padding: "10px 16px",
    fontSize: 10,
    color: "var(--accent-text)",
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    letterSpacing: 2,
    borderBottom: "1px solid var(--border-light)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(3,5,10,0.4)",
    textTransform: "uppercase",
  };

  return (
    <div
      style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        padding: "0 28px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "48px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--accent-text)",
              fontFamily: "var(--font-mono)",
              letterSpacing: 3,
              marginBottom: 8,
              opacity: 0.75,
            }}
          >
            // MODULE · 01
          </div>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 800,
              fontFamily: "var(--font-sans)",
              letterSpacing: -0.8,
              background:
                "linear-gradient(135deg, #ffffff 0%, #7ff1ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t("tools.jsonFormatter.name")}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #8b7dff 0%, #ff7fb7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {" "}
              & Fixer
            </span>
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 8,
              fontFamily: "var(--font-mono)",
              letterSpacing: 0.2,
            }}
          >
            {t("tools.jsonFormatter.desc")}
          </p>
        </div>
        <StatusPill valid={isValid} fixing={fixing} t={t} />
      </div>

      {/* Toolbar */}
      <div
        style={{
          padding: "20px 0",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {[2, 4].map((n) => (
            <button
              key={n}
              onClick={() => setIndent(n)}
              style={btnStyle(indent === n)}
            >
              {n} {t("tools.jsonFormatter.spaces")}
            </button>
          ))}
          <div
            style={{
              width: 1,
              height: 20,
              background: "var(--border)",
              margin: "0 6px",
            }}
          />
          <button
            onClick={handleMinify}
            disabled={!isValid}
            style={{
              ...btnStyle(false),
              opacity: isValid ? 1 : 0.35,
              cursor: isValid ? "pointer" : "not-allowed",
            }}
          >
            ⟲ {t("tools.jsonFormatter.minify")}
          </button>
          <button onClick={handleCopy} style={btnStyle(copied)}>
            {copied
              ? "✓ " + t("tools.jsonFormatter.copied")
              : "⎘ " + t("tools.jsonFormatter.copy")}
          </button>
          <button onClick={handleClear} style={btnStyle(false)}>
            ✕ {t("tools.jsonFormatter.clear")}
          </button>
        </div>
        <button
          onClick={handleLoadSample}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px dashed rgba(139,125,255,0.4)",
            background: "transparent",
            color: "#b8afff",
            fontSize: 11,
            letterSpacing: 0.5,
          }}
        >
          ↻ {t("tools.jsonFormatter.loadSample")}
        </button>
      </div>

      {/* Editor */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          paddingBottom: 20,
        }}
      >
        {/* Input Panel */}
        <div style={panelStyle(isValid === false)}>
          <div style={panelHeader}>
            <span>
              <span style={{ color: "var(--accent)" }}>›</span>{" "}
              {t("tools.jsonFormatter.inputLabel")}
            </span>
            <span
              style={{
                color: "var(--text-muted)",
                fontWeight: 500,
                letterSpacing: 1,
              }}
            >
              {String(inputLines).padStart(3, "0")} LN · {stats.size}B
            </span>
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
                minHeight: 440,
                padding: "16px 16px 16px 58px",
                background: "transparent",
                border: "none",
                color: "#dbe7ff",
                fontSize: 13,
                lineHeight: "20px",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div style={panelStyle(false)}>
          <div style={panelHeader}>
            <span>
              <span style={{ color: "var(--accent-3)" }}>›</span>{" "}
              {t("tools.jsonFormatter.outputLabel")}
            </span>
            {isValid && (
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 500,
                  letterSpacing: 1,
                }}
              >
                {String(outputLines).padStart(3, "0")} LN · DEPTH{" "}
                {stats.depth}
              </span>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <LineNumbers count={isValid ? outputLines : 1} />
            {isValid === false ? (
              <div
                style={{
                  padding: "24px 24px 24px 58px",
                  minHeight: 440,
                }}
              >
                {/* Error */}
                <div
                  style={{
                    background: "rgba(255,77,109,0.08)",
                    border: "1px solid rgba(255,77,109,0.3)",
                    borderRadius: "var(--radius-sm)",
                    padding: 16,
                    marginBottom: 16,
                    boxShadow: "inset 0 0 16px rgba(255,77,109,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#ff4d6d",
                      marginBottom: 8,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    ✕ {t("tools.jsonFormatter.parseError")}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#ffb3c0",
                      fontFamily: "var(--font-mono)",
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {error}
                  </div>
                </div>

                {/* AI Fix */}
                <button
                  onClick={handleAiFix}
                  disabled={fixing}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(139,125,255,0.45)",
                    background: fixing
                      ? "linear-gradient(90deg, rgba(139,125,255,0.1) 0%, rgba(139,125,255,0.28) 50%, rgba(139,125,255,0.1) 100%)"
                      : "linear-gradient(135deg, rgba(139,125,255,0.18) 0%, rgba(0,229,255,0.12) 100%)",
                    backgroundSize: fixing ? "200% 100%" : "100% 100%",
                    animation: fixing ? "shimmer 1.5s ease infinite" : "none",
                    color: "#d6cfff",
                    cursor: fixing ? "wait" : "pointer",
                    fontSize: 14,
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow:
                      "0 0 24px rgba(139,125,255,0.25), inset 0 0 18px rgba(139,125,255,0.12)",
                  }}
                >
                  {fixing ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--ai-purple)",
                          boxShadow: "0 0 8px var(--ai-purple)",
                          animation: "pulse 0.8s ease infinite",
                        }}
                      />
                      {t("tools.jsonFormatter.aiFixing")}
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: 16,
                          textShadow: "0 0 12px rgba(139,125,255,0.8)",
                        }}
                      >
                        ✦
                      </span>
                      {t("tools.jsonFormatter.fixWithAi")}
                    </>
                  )}
                </button>
                <p
                  style={{
                    fontSize: 10.5,
                    color: "var(--text-muted)",
                    marginTop: 12,
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: 1,
                  }}
                >
                  {t("tools.jsonFormatter.fixHint")}
                </p>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                style={{
                  width: "100%",
                  minHeight: 440,
                  padding: "16px 16px 16px 58px",
                  background: "transparent",
                  border: "none",
                  color: "#7ff3c7",
                  fontSize: 13,
                  lineHeight: "20px",
                  resize: "vertical",
                  textShadow: "0 0 10px rgba(16,244,168,0.18)",
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
              background:
                "linear-gradient(135deg, rgba(16,244,168,0.08) 0%, rgba(0,229,255,0.06) 100%)",
              border: "1px solid rgba(16,244,168,0.3)",
              borderRadius: "var(--radius)",
              padding: "16px 22px",
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              boxShadow: "inset 0 0 20px rgba(16,244,168,0.06)",
            }}
          >
            <span
              style={{
                fontSize: 18,
                lineHeight: 1,
                flexShrink: 0,
                marginTop: 1,
                color: "#10f4a8",
                textShadow: "0 0 12px rgba(16,244,168,0.8)",
              }}
            >
              ✦
            </span>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7ff3c7",
                  marginBottom: 8,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {t("tools.jsonFormatter.aiFixedCount", { count: fixes.length })}
              </div>
              {fixes.map((f, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span style={{ color: "#10f4a8", marginRight: 8 }}>→</span>
                  {t(`fixes.${f}`, f)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          padding: "28px 0 60px",
        }}
      >
        {[
          {
            icon: "⚡",
            color: "#00e5ff",
            titleKey: "features.instant",
            descKey: "features.instantDesc",
          },
          {
            icon: "✦",
            color: "#8b7dff",
            titleKey: "features.aiFix",
            descKey: "features.aiFixDesc",
          },
          {
            icon: "◈",
            color: "#10f4a8",
            titleKey: "features.private",
            descKey: "features.privateDesc",
          },
          {
            icon: "∞",
            color: "#ff7fb7",
            titleKey: "features.free",
            descKey: "features.freeDesc",
          },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              padding: 18,
              borderRadius: "var(--radius)",
              background:
                "linear-gradient(160deg, rgba(14,20,36,0.7) 0%, rgba(6,10,20,0.7) 100%)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = f.color + "55";
              e.currentTarget.style.boxShadow = `0 10px 30px ${f.color}20, inset 0 0 22px ${f.color}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                fontSize: 20,
                marginBottom: 10,
                color: f.color,
                textShadow: `0 0 14px ${f.color}80`,
              }}
            >
              {f.icon}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 4,
                letterSpacing: 0.2,
              }}
            >
              {t(f.titleKey)}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.6,
              }}
            >
              {t(f.descKey)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
