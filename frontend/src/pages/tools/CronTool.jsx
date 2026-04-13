import { useState } from "react";
import { useTranslation } from "react-i18next";
import { aiCron } from "../../api/client";
import SEO, { schema } from "../../components/SEO";

const CRON_FIELDS = ["minute", "hour", "day", "month", "weekday"];

export default function CronTool() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "zh";

  const [mode, setMode] = useState("to_cron"); // to_cron | to_human
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copiedCron, setCopiedCron] = useState(false);

  const handleRun = async () => {
    if (loading || !input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await aiCron(input.trim(), mode, lang, new Date().toISOString(), tz);
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "AI call failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRun();
    }
  };

  const handleCopyCron = () => {
    if (!result?.cron) return;
    navigator.clipboard.writeText(result.cron).then(() => {
      setCopiedCron(true);
      setTimeout(() => setCopiedCron(false), 1500);
    });
  };

  const samples =
    mode === "to_cron"
      ? [t("tools.cron.s1"), t("tools.cron.s2"), t("tools.cron.s3")]
      : ["0 9 * * 1", "*/5 * * * *", "0 0 1 * *"];

  const cronParts = result?.cron ? result.cron.trim().split(/\s+/) : [];

  return (
    <>
      <SEO
        title={t("tools.cron.name")}
        description={t("tools.cron.desc")}
        path="/tools/cron"
        structuredData={schema.softwareApp({
          name: "OneTools AI Cron Tool",
          description: t("tools.cron.desc"),
          url: "https://onetools.dev/tools/cron",
        })}
      />
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #10b981, #14b8a6)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
              }}
            >
              *&nbsp;*
            </span>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.8,
                color: "var(--text-primary)",
              }}
            >
              {t("tools.cron.name")}
            </h1>
          </div>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            {t("tools.cron.desc")}
          </p>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "#fff",
            padding: 3,
            marginBottom: 16,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {["to_cron", "to_human"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setInput("");
                setResult(null);
                setError("");
              }}
              style={{
                padding: "7px 18px",
                borderRadius: 999,
                border: "none",
                background: mode === m ? "var(--text-primary)" : "transparent",
                color: mode === m ? "#fff" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                letterSpacing: -0.1,
              }}
            >
              {t(`tools.cron.mode_${m}`)}
            </button>
          ))}
        </div>

        {/* Input Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 20,
            marginBottom: 16,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {mode === "to_cron"
              ? t("tools.cron.nlLabel")
              : t("tools.cron.cronLabel")}
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "to_cron"
                ? t("tools.cron.nlPlaceholder")
                : t("tools.cron.cronPlaceholder")
            }
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 15,
              fontFamily:
                mode === "to_human" ? "var(--font-mono)" : "var(--font-sans)",
              outline: "none",
              transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--brand)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--border)")
            }
          />

          {/* Samples */}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {samples.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily:
                    mode === "to_human"
                      ? "var(--font-mono)"
                      : "var(--font-sans)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "var(--brand)";
                  e.target.style.color = "var(--brand)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.color = "var(--text-secondary)";
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={loading || !input.trim()}
            style={{
              marginTop: 14,
              padding: "10px 24px",
              borderRadius: 999,
              border: "none",
              background:
                loading || !input.trim()
                  ? "var(--text-faint)"
                  : "var(--text-primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor:
                loading || !input.trim() ? "not-allowed" : "pointer",
              letterSpacing: -0.1,
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 14px rgba(10,11,16,0.2)",
              transition: "all 0.2s",
            }}
          >
            {loading ? t("tools.cron.running") : t("tools.cron.run")}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Cron Expression Card */}
            {result.cron && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 20,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t("tools.cron.expression")}
                  </span>
                  <button
                    onClick={handleCopyCron}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      border: "1px solid var(--border)",
                      background: "#fff",
                      fontSize: 12,
                      fontWeight: 500,
                      color: copiedCron
                        ? "var(--green)"
                        : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {copiedCron
                      ? t("tools.cron.copied")
                      : t("tools.cron.copy")}
                  </button>
                </div>

                {/* Big cron display */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    textAlign: "center",
                    padding: "12px 0",
                    letterSpacing: 2,
                  }}
                >
                  {result.cron}
                </div>

                {/* Field labels */}
                {cronParts.length === 5 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 0,
                      marginTop: 8,
                    }}
                  >
                    {cronParts.map((part, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minWidth: 64,
                          padding: "0 8px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--brand)",
                            marginBottom: 4,
                          }}
                        >
                          {part}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            color: "var(--text-faint)",
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: 0.3,
                          }}
                        >
                          {t(`tools.cron.field_${CRON_FIELDS[i]}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Explanation Card */}
            {result.explanation && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 20,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {t("tools.cron.explanationLabel")}
                </span>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--text-primary)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {result.explanation}
                </p>
              </div>
            )}

            {/* Next 5 Execution Times */}
            {result.next_5 && result.next_5.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 20,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  {t("tools.cron.next5")}
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                  }}
                >
                  {result.next_5.map((time, i) => {
                    let display = time;
                    try {
                      const d = new Date(time);
                      if (!isNaN(d.getTime())) {
                        display = d.toLocaleString(
                          lang === "zh" ? "zh-CN" : "en-US",
                          {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }
                        );
                      }
                    } catch {}
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 0",
                          borderBottom:
                            i < result.next_5.length - 1
                              ? "1px solid var(--border-light, #f0f1f3)"
                              : "none",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "var(--brand)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          {display}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
