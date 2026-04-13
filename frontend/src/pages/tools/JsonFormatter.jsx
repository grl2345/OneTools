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
        width: 42,
        background: "transparent",
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
            color: "var(--text-faint)",
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
      <Pill color="var(--purple)" bg="var(--purple-soft)">
        <Dot color="var(--purple)" pulse />
        {t("tools.jsonFormatter.aiFixing")}
      </Pill>
    );
  if (valid === null) return null;
  return valid ? (
    <Pill color="var(--green)" bg="var(--green-soft)">
      <Dot color="var(--green)" />
      {t("tools.jsonFormatter.validJson")}
    </Pill>
  ) : (
    <Pill color="var(--red)" bg="var(--red-soft)">
      <Dot color="var(--red)" />
      {t("tools.jsonFormatter.invalidJson")}
    </Pill>
  );
}

function Pill({ children, color, bg }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: bg,
        color: color,
        letterSpacing: -0.1,
      }}
    >
      {children}
    </span>
  );
}

function Dot({ color, pulse }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        animation: pulse ? "pulse 1s ease infinite" : "none",
      }}
    />
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

  let stats = { size: 0, depth: "—" };
  try {
    const obj = JSON.parse(input);
    stats = { size: new Blob([input]).size, depth: getDepth(obj) };
  } catch {
    stats = { size: new Blob([input]).size, depth: "—" };
  }

  const btn = (active) => ({
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: active ? "rgba(255,255,255,0.08)" : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: -0.1,
    transition: "all 0.15s ease",
  });

  const panel = (danger) => ({
    background: "var(--bg-card)",
    border: `1px solid ${danger ? "rgba(255,69,58,0.35)" : "var(--border)"}`,
    borderRadius: "var(--radius)",
    overflow: "hidden",
    transition: "border-color 0.2s ease",
  });

  const panelHeader = {
    padding: "10px 14px",
    fontSize: 12,
    color: "var(--text-muted)",
    fontWeight: 500,
    borderBottom: "1px solid var(--border-light)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    letterSpacing: -0.1,
  };

  return (
    <div
      style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        padding: "0 24px",
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
          <h1
            style={{
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: -1.2,
              lineHeight: 1.1,
              color: "var(--text-primary)",
            }}
          >
            {t("tools.jsonFormatter.name")}
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
              {" "}& Fixer
            </span>
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: "var(--text-secondary)",
              marginTop: 8,
              fontWeight: 400,
              letterSpacing: -0.15,
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
          padding: "24px 0 14px",
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
              style={btn(indent === n)}
            >
              {n} {t("tools.jsonFormatter.spaces")}
            </button>
          ))}
          <div
            style={{
              width: 1,
              height: 18,
              background: "var(--border)",
              margin: "0 6px",
            }}
          />
          <button
            onClick={handleMinify}
            disabled={!isValid}
            style={{
              ...btn(false),
              opacity: isValid ? 1 : 0.4,
            }}
          >
            {t("tools.jsonFormatter.minify")}
          </button>
          <button onClick={handleCopy} style={btn(copied)}>
            {copied ? "✓ " + t("tools.jsonFormatter.copied") : t("tools.jsonFormatter.copy")}
          </button>
          <button onClick={handleClear} style={btn(false)}>
            {t("tools.jsonFormatter.clear")}
          </button>
        </div>
        <button
          onClick={handleLoadSample}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          {t("tools.jsonFormatter.loadSample")}
        </button>
      </div>

      {/* Editor */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          paddingBottom: 20,
        }}
      >
        {/* Input */}
        <div style={panel(isValid === false)}>
          <div style={panelHeader}>
            <span>{t("tools.jsonFormatter.inputLabel")}</span>
            <span style={{ color: "var(--text-faint)" }}>
              {inputLines} {t("tools.jsonFormatter.lines")} · {stats.size}B
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

        {/* Output */}
        <div style={panel(false)}>
          <div style={panelHeader}>
            <span>{t("tools.jsonFormatter.outputLabel")}</span>
            {isValid && (
              <span style={{ color: "var(--text-faint)" }}>
                {outputLines} {t("tools.jsonFormatter.lines")} ·{" "}
                {t("tools.jsonFormatter.depth")} {stats.depth}
              </span>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <LineNumbers count={isValid ? outputLines : 1} />
            {isValid === false ? (
              <div style={{ padding: "20px 20px 20px 52px", minHeight: 440 }}>
                <div
                  style={{
                    background: "var(--red-soft)",
                    border: "1px solid rgba(255,69,58,0.22)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 14px",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--red)",
                      marginBottom: 4,
                      letterSpacing: -0.1,
                    }}
                  >
                    {t("tools.jsonFormatter.parseError")}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#ff8e85",
                      fontFamily: "var(--font-mono)",
                      lineHeight: 1.55,
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
                    padding: "12px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-strong)",
                    background: fixing
                      ? "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)"
                      : "linear-gradient(180deg, #1c1c1f 0%, #141416 100%)",
                    backgroundSize: fixing ? "200% 100%" : "100% 100%",
                    animation: fixing ? "shimmer 1.5s ease infinite" : "none",
                    color: "var(--text-primary)",
                    cursor: fixing ? "wait" : "pointer",
                    fontSize: 13.5,
                    fontWeight: 600,
                    letterSpacing: -0.1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow:
                      "0 1px 0 rgba(255,255,255,0.06) inset, 0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {fixing ? (
                    <>
                      <Dot color="var(--purple)" pulse />
                      {t("tools.jsonFormatter.aiFixing")}
                    </>
                  ) : (
                    <>
                      <span style={{ color: "var(--purple)", fontSize: 15 }}>✦</span>
                      {t("tools.jsonFormatter.fixWithAi")}
                    </>
                  )}
                </button>
                <p
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-faint)",
                    marginTop: 10,
                    textAlign: "center",
                    letterSpacing: -0.1,
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
                  padding: "16px 16px 16px 52px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
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
        <div style={{ paddingBottom: 20, animation: "fadeIn 0.3s ease both" }}>
          <div
            style={{
              background: "var(--green-soft)",
              border: "1px solid rgba(48,209,88,0.22)",
              borderRadius: "var(--radius)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 15, color: "var(--green)", marginTop: 1 }}>✦</span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--green)",
                  marginBottom: 6,
                  letterSpacing: -0.1,
                }}
              >
                {t("tools.jsonFormatter.aiFixedCount", { count: fixes.length })}
              </div>
              {fixes.map((f, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: "var(--green)", marginRight: 8 }}>→</span>
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
          gap: 10,
          padding: "24px 0 72px",
        }}
      >
        {[
          {
            icon: "⚡",
            color: "var(--orange)",
            titleKey: "features.instant",
            descKey: "features.instantDesc",
          },
          {
            icon: "✦",
            color: "var(--purple)",
            titleKey: "features.aiFix",
            descKey: "features.aiFixDesc",
          },
          {
            icon: "◈",
            color: "var(--teal)",
            titleKey: "features.private",
            descKey: "features.privateDesc",
          },
          {
            icon: "∞",
            color: "var(--pink)",
            titleKey: "features.free",
            descKey: "features.freeDesc",
          },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              padding: 18,
              borderRadius: "var(--radius)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.background = "var(--bg-subtle)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--bg-card)";
            }}
          >
            <div
              style={{
                fontSize: 18,
                marginBottom: 10,
                color: f.color,
              }}
            >
              {f.icon}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 3,
                letterSpacing: -0.2,
              }}
            >
              {t(f.titleKey)}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--text-muted)",
                lineHeight: 1.55,
                letterSpacing: -0.1,
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
