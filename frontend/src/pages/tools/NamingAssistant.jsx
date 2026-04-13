import { useState } from "react";
import { useTranslation } from "react-i18next";
import { aiNaming } from "../../api/client";
import SEO, { schema } from "../../components/SEO";

const STYLE_COLORS = {
  camelCase: "#5b5bf5",
  snake_case: "#10b981",
  "kebab-case": "#f59e0b",
  PascalCase: "#ec4899",
  UPPER_SNAKE_CASE: "#ef4444",
};

const CATEGORY_LABELS = {
  variable: { zh: "变量", en: "variable" },
  function: { zh: "函数", en: "function" },
  class: { zh: "类", en: "class" },
  constant: { zh: "常量", en: "constant" },
  project: { zh: "项目", en: "project" },
  file: { zh: "文件", en: "file" },
  component: { zh: "组件", en: "component" },
};

export default function NamingAssistant() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "zh";

  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [filter, setFilter] = useState("all");

  const handleGenerate = async () => {
    if (loading || !description.trim()) return;
    setLoading(true);
    setError("");
    setSuggestions([]);
    setFilter("all");
    try {
      const res = await aiNaming(description.trim(), lang);
      setSuggestions(res.suggestions || []);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "AI call failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (name, idx) => {
    navigator.clipboard.writeText(name).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(-1), 1500);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const styles = [...new Set(suggestions.map((s) => s.style))];
  const filtered =
    filter === "all" ? suggestions : suggestions.filter((s) => s.style === filter);

  const samples = [
    t("tools.naming.s1"),
    t("tools.naming.s2"),
    t("tools.naming.s3"),
  ];

  return (
    <>
      <SEO
        title={t("tools.naming.name")}
        description={t("tools.naming.desc")}
        path="/tools/naming"
        structuredData={schema.softwareApp({
          name: "OneTools AI Naming Assistant",
          description: t("tools.naming.desc"),
          url: "https://onetools.dev/tools/naming",
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
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              Aa
            </span>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.8,
                color: "var(--text-primary)",
              }}
            >
              {t("tools.naming.name")}
            </h1>
          </div>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            {t("tools.naming.desc")}
          </p>
        </div>

        {/* Input */}
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
            {t("tools.naming.inputLabel")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("tools.naming.placeholder")}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 14,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.6,
              resize: "vertical",
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
                onClick={() => setDescription(s)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
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

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !description.trim()}
            style={{
              marginTop: 14,
              padding: "10px 24px",
              borderRadius: 999,
              border: "none",
              background:
                loading || !description.trim()
                  ? "var(--text-faint)"
                  : "var(--text-primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor:
                loading || !description.trim() ? "not-allowed" : "pointer",
              letterSpacing: -0.1,
              boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 14px rgba(10,11,16,0.2)",
              transition: "all 0.2s",
            }}
          >
            {loading ? t("tools.naming.generating") : t("tools.naming.generate")}
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

        {/* Style filter tabs */}
        {suggestions.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <FilterPill
              label={t("tools.naming.all")}
              active={filter === "all"}
              onClick={() => setFilter("all")}
              color="var(--text-primary)"
            />
            {styles.map((s) => (
              <FilterPill
                key={s}
                label={s}
                active={filter === s}
                onClick={() => setFilter(s)}
                color={STYLE_COLORS[s] || "var(--brand)"}
              />
            ))}
          </div>
        )}

        {/* Results */}
        {filtered.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 10,
            }}
          >
            {filtered.map((item, i) => {
              const color = STYLE_COLORS[item.style] || "var(--brand)";
              const catLabel =
                CATEGORY_LABELS[item.category]?.[lang] ||
                item.category;
              return (
                <div
                  key={i}
                  onClick={() => handleCopy(item.name, i)}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "16px 18px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: "var(--shadow-sm)",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 4px 16px ${color}18`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  {/* Name */}
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 8,
                      wordBreak: "break-all",
                    }}
                  >
                    {item.name}
                  </div>

                  {/* Tags */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginBottom: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: `${color}14`,
                        border: `1px solid ${color}33`,
                        fontSize: 11,
                        fontWeight: 600,
                        color,
                      }}
                    >
                      {item.style}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "var(--bg-muted, #f5f6f8)",
                        border: "1px solid var(--border)",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {catLabel}
                    </span>
                  </div>

                  {/* Explanation */}
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.explanation}
                  </div>

                  {/* Copy hint */}
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 14,
                      fontSize: 11,
                      color:
                        copiedIdx === i ? "var(--green)" : "var(--text-faint)",
                      fontWeight: 500,
                      transition: "color 0.15s",
                    }}
                  >
                    {copiedIdx === i
                      ? t("tools.naming.copied")
                      : t("tools.naming.clickCopy")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function FilterPill({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? color : "var(--border)"}`,
        background: active ? `${color}14` : "#fff",
        color: active ? color : "var(--text-secondary)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
