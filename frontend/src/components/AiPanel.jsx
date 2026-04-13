import { useState } from "react";
import { useTranslation } from "react-i18next";
import { aiExplain } from "../api/client";

/**
 * Shared AI-analysis panel reused across Base64 / URL / HTML / Hash / JWT /
 * UUID tools. Renders a single button; when pressed, calls /api/ai/explain
 * with the given tool key + content and displays explanation / highlights /
 * suggestions.
 */
export default function AiPanel({
  tool,
  content,
  context,
  disabled,
  compact,
}) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!content || !content.trim() || loading) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const r = await aiExplain(tool, content, context, i18n.language || "zh");
      setResult(r);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "AI call failed");
    } finally {
      setLoading(false);
    }
  };

  const wrap = {
    padding: compact ? 14 : 18,
    borderRadius: "var(--radius)",
    background: "#ffffff",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-md)",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div style={wrap}>
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 180,
          height: 180,
          background:
            "radial-gradient(closest-side, rgba(91,91,245,0.18), transparent)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
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
            {t("ai.title")}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--text-muted)",
              marginTop: 1,
            }}
          >
            {t("ai.subtitle")}
          </div>
        </div>
        <button
          onClick={run}
          disabled={disabled || loading || !content?.trim()}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background:
              disabled || loading || !content?.trim()
                ? "#d8d8e0"
                : "var(--gradient-brand)",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: -0.1,
            cursor:
              disabled || loading || !content?.trim()
                ? "not-allowed"
                : "pointer",
            boxShadow:
              disabled || loading || !content?.trim()
                ? "none"
                : "0 4px 14px rgba(91,91,245,0.35)",
          }}
        >
          {loading ? t("ai.analyzing") : t("ai.analyze")}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.25)",
            fontSize: 12.5,
            color: "var(--red)",
            position: "relative",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            position: "relative",
            animation: "fadeIn 0.25s ease both",
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              color: "var(--text-primary)",
              lineHeight: 1.7,
              marginBottom: result.highlights?.length ? 12 : 0,
            }}
          >
            {result.explanation}
          </div>

          {result.highlights?.length > 0 && (
            <ul
              style={{
                margin: "0 0 10px 0",
                padding: "0 0 0 0",
                listStyle: "none",
              }}
            >
              {result.highlights.map((h, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    padding: "6px 0",
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                    lineHeight: 1.55,
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <span style={{ color: "var(--brand)", flexShrink: 0 }}>
                    ▸
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          {result.suggestions?.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.22)",
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--green)",
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {t("ai.suggestions")}
              </div>
              {result.suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                    lineHeight: 1.55,
                    padding: "3px 0",
                  }}
                >
                  <span style={{ color: "var(--green)", marginRight: 6 }}>
                    →
                  </span>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
