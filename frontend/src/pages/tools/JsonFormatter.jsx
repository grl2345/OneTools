import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { aiJsonQuery, aiJsonSchema } from "../../api/client";
import SEO, { schema } from "../../components/SEO";

const SAMPLE_JSON = `{
  "name": "OneTools",
  "version": "1.0.0",
  "tools": [
    { "id": "json-formatter", "status": "live" },
    { "id": "regex-tester", "status": "coming-soon" }
  ],
  "config": {
    "theme": "light"
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

function Pill({ children, color, bg, border }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color,
        border: `1px solid ${border}`,
        letterSpacing: -0.1,
      }}
    >
      {children}
    </span>
  );
}

function StatusPill({ valid, t }) {
  if (valid === null) return null;
  return valid ? (
    <Pill
      color="var(--green)"
      bg="rgba(16,185,129,0.1)"
      border="rgba(16,185,129,0.25)"
    >
      <Dot color="var(--green)" />
      {t("tools.jsonFormatter.validJson")}
    </Pill>
  ) : (
    <Pill
      color="var(--red)"
      bg="rgba(239,68,68,0.1)"
      border="rgba(239,68,68,0.25)"
    >
      <Dot color="var(--red)" />
      {t("tools.jsonFormatter.invalidJson")}
    </Pill>
  );
}

export default function JsonFormatter() {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState(2);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [copied, setCopied] = useState(false);

  // AI state
  const [aiMode, setAiMode] = useState("query"); // "query" | "schema"
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  const handleAiRun = async () => {
    if (aiLoading || !isValid) return;
    setAiError(null);
    setAiResult(null);
    setAiLoading(true);
    try {
      const lang = i18n.language || "zh";
      if (aiMode === "query") {
        if (!aiQuery.trim()) {
          setAiLoading(false);
          return;
        }
        const r = await aiJsonQuery(input, aiQuery.trim(), lang);
        setAiResult({ kind: "query", ...r });
      } else {
        const r = await aiJsonSchema(input, lang);
        setAiResult({ kind: "schema", ...r });
      }
    } catch (e) {
      setAiError(e?.response?.data?.detail || e?.message || "AI call failed");
    } finally {
      setAiLoading(false);
    }
  };

  const processJson = useCallback((val, ind) => {
    if (!val.trim()) {
      setOutput("");
      setError(null);
      setIsValid(null);
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
    background: active ? "var(--brand)" : "var(--bg-card)",
    color: active ? "#fff" : "var(--text-secondary)",
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: -0.1,
    transition: "all 0.15s ease",
    boxShadow: active
      ? "0 1px 2px rgba(10,11,16,0.2)"
      : "0 1px 2px rgba(10,11,16,0.03)",
  });

  const panel = (danger) => ({
    background: "var(--bg-card)",
    border: `1px solid ${danger ? "rgba(239,68,68,0.35)" : "var(--border)"}`,
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
    transition: "border-color 0.2s ease",
  });

  const panelHeader = {
    padding: "10px 14px",
    fontSize: 12,
    color: "var(--text-secondary)",
    fontWeight: 500,
    borderBottom: "1px solid var(--border-light)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--bg-subtle)",
    letterSpacing: -0.1,
  };

  return (
    <>
      <SEO
        title={t("tools.jsonFormatter.name")}
        description={t("tools.jsonFormatter.desc")}
        path="/tools/json"
        structuredData={schema.softwareApp({
          name: "OneTools JSON Formatter",
          description: t("tools.jsonFormatter.desc"),
          url: "https://onetools.dev/tools/json",
        })}
      />
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
          padding: "56px 0 0",
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
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: -1.4,
              lineHeight: 1.08,
              color: "var(--text-primary)",
            }}
          >
            {t("tools.jsonFormatter.name")}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginTop: 8,
              fontWeight: 400,
              letterSpacing: -0.15,
            }}
          >
            {t("tools.jsonFormatter.desc")}
          </p>
        </div>
        <StatusPill valid={isValid} t={t} />
      </div>

      {/* Toolbar */}
      <div
        style={{
          padding: "28px 0 14px",
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
            style={{ ...btn(false), opacity: isValid ? 1 : 0.4 }}
          >
            {t("tools.jsonFormatter.minify")}
          </button>
          <button onClick={handleCopy} style={btn(copied)}>
            {copied
              ? "✓ " + t("tools.jsonFormatter.copied")
              : t("tools.jsonFormatter.copy")}
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
            border: "1px dashed var(--border-strong)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12.5,
            fontWeight: 500,
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
                padding: "16px 16px 16px 54px",
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
              <div style={{ padding: "20px 20px 20px 54px", minHeight: 440 }}>
                {/* Error card */}
                <div
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.22)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 14px",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
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
                      color: "#c43030",
                      fontFamily: "var(--font-mono)",
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {error}
                  </div>
                </div>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                style={{
                  width: "100%",
                  minHeight: 440,
                  padding: "16px 16px 16px 54px",
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

      {/* ── AI assistant ───────────────────────── */}
      <div
        style={{
          padding: "12px 0 24px",
        }}
      >
        <div
          style={{
            padding: 18,
            borderRadius: "var(--radius)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              background:
                "radial-gradient(closest-side, rgba(91,91,245,0.2), transparent)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
              position: "relative",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "var(--gradient-brand)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ✦
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: -0.2,
                }}
              >
                {t("tools.jsonFormatter.ai.title")}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 1,
                }}
              >
                {t("tools.jsonFormatter.ai.subtitle")}
              </div>
            </div>

            {/* Mode toggle */}
            <div
              style={{
                display: "flex",
                gap: 4,
                background: "var(--bg-subtle)",
                padding: 3,
                borderRadius: 999,
              }}
            >
              {["query", "schema"].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setAiMode(m);
                    setAiResult(null);
                    setAiError(null);
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    border: "none",
                    background:
                      aiMode === m
                        ? "var(--text-primary)"
                        : "transparent",
                    color:
                      aiMode === m ? "#fff" : "var(--text-secondary)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: -0.1,
                    cursor: "pointer",
                  }}
                >
                  {t("tools.jsonFormatter.ai." + m)}
                </button>
              ))}
            </div>
          </div>

          {aiMode === "query" && (
            <div
              style={{
                display: "flex",
                gap: 8,
                position: "relative",
              }}
            >
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiRun()}
                placeholder={t("tools.jsonFormatter.ai.queryPlaceholder")}
                disabled={!isValid}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-card)",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  outline: "none",
                  opacity: isValid ? 1 : 0.5,
                }}
              />
              <button
                onClick={handleAiRun}
                disabled={aiLoading || !isValid || !aiQuery.trim()}
                style={{
                  padding: "10px 18px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background:
                    aiLoading || !isValid || !aiQuery.trim()
                      ? "#d8d8e0"
                      : "var(--gradient-brand)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: -0.1,
                  boxShadow:
                    aiLoading || !isValid || !aiQuery.trim()
                      ? "none"
                      : "0 4px 14px rgba(91,91,245,0.35)",
                  cursor:
                    aiLoading || !isValid || !aiQuery.trim()
                      ? "not-allowed"
                      : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {aiLoading
                  ? t("tools.jsonFormatter.ai.running")
                  : t("tools.jsonFormatter.ai.run")}
              </button>
            </div>
          )}

          {aiMode === "schema" && (
            <div style={{ position: "relative" }}>
              <button
                onClick={handleAiRun}
                disabled={aiLoading || !isValid}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background:
                    aiLoading || !isValid
                      ? "#d8d8e0"
                      : "var(--gradient-brand)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: -0.1,
                  boxShadow:
                    aiLoading || !isValid
                      ? "none"
                      : "0 4px 14px rgba(91,91,245,0.35)",
                  cursor:
                    aiLoading || !isValid ? "not-allowed" : "pointer",
                }}
              >
                {aiLoading
                  ? t("tools.jsonFormatter.ai.inferring")
                  : t("tools.jsonFormatter.ai.inferSchema")}
              </button>
            </div>
          )}

          {aiMode === "query" && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginTop: 10,
                position: "relative",
              }}
            >
              {[
                t("tools.jsonFormatter.ai.s1"),
                t("tools.jsonFormatter.ai.s2"),
                t("tools.jsonFormatter.ai.s3"),
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => setAiQuery(s)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: "rgba(91,91,245,0.04)",
                    color: "var(--text-secondary)",
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {aiError && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                fontSize: 12.5,
                color: "var(--red)",
                position: "relative",
              }}
            >
              {aiError}
            </div>
          )}

          {aiResult?.kind === "query" && (
            <div
              style={{
                marginTop: 14,
                padding: "14px 16px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(91,91,245,0.05)",
                border: "1px solid rgba(91,91,245,0.2)",
                position: "relative",
                animation: "fadeIn 0.25s ease both",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <code
                  style={{
                    fontSize: 11.5,
                    padding: "3px 8px",
                    borderRadius: 5,
                    background: "rgba(91,91,245,0.1)",
                    color: "var(--brand)",
                    fontFamily: "var(--font-mono)",
                    border: "1px solid rgba(91,91,245,0.2)",
                  }}
                >
                  {aiResult.expression}
                </code>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  · {aiResult.matched_count}{" "}
                  {t("tools.jsonFormatter.ai.matched")}
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  borderRadius: 6,
                  background: "#0b0d14",
                  color: "#d6dbe6",
                  fontSize: 12.5,
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1.55,
                  overflow: "auto",
                  maxHeight: 240,
                }}
              >
                {(() => {
                  try {
                    return JSON.stringify(
                      JSON.parse(aiResult.result),
                      null,
                      2
                    );
                  } catch {
                    return aiResult.result;
                  }
                })()}
              </pre>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12.5,
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                }}
              >
                {aiResult.explanation}
              </div>
            </div>
          )}

          {aiResult?.kind === "schema" && (
            <div
              style={{
                marginTop: 14,
                padding: "14px 16px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(91,91,245,0.05)",
                border: "1px solid rgba(91,91,245,0.2)",
                position: "relative",
                animation: "fadeIn 0.25s ease both",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  marginBottom: 10,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                {aiResult.summary}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12.5,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <Th>{t("tools.jsonFormatter.ai.colPath")}</Th>
                      <Th>{t("tools.jsonFormatter.ai.colType")}</Th>
                      <Th>{t("tools.jsonFormatter.ai.colDesc")}</Th>
                      <Th>{t("tools.jsonFormatter.ai.colExample")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiResult.fields.map((f, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom:
                            "1px solid var(--border-light)",
                        }}
                      >
                        <Td mono>{f.path}</Td>
                        <Td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "rgba(91,91,245,0.08)",
                              color: "var(--brand)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {f.type}
                          </span>
                        </Td>
                        <Td>{f.description}</Td>
                        <Td mono>
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: 11.5,
                            }}
                          >
                            {f.example}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details style={{ marginTop: 12 }}>
                <summary
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  {t("tools.jsonFormatter.ai.viewSchema")}
                </summary>
                <pre
                  style={{
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 6,
                    background: "#0b0d14",
                    color: "#d6dbe6",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.55,
                    overflow: "auto",
                    maxHeight: 260,
                  }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(
                        JSON.parse(aiResult.schema_json),
                        null,
                        2
                      );
                    } catch {
                      return aiResult.schema_json;
                    }
                  })()}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>

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
            icon: "✓",
            color: "var(--green)",
            titleKey: "features.validate",
            descKey: "features.validateDesc",
          },
          {
            icon: "◈",
            color: "var(--cyan)",
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
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              e.currentTarget.style.transform = "translateY(0)";
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
    </>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "8px 10px",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-muted)",
        letterSpacing: 0.5,
        textTransform: "uppercase",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, mono }) {
  return (
    <td
      style={{
        padding: "8px 10px",
        fontSize: 12.5,
        color: "var(--text-primary)",
        fontFamily: mono ? "var(--font-mono)" : "inherit",
        verticalAlign: "top",
        wordBreak: "break-word",
      }}
    >
      {children}
    </td>
  );
}
