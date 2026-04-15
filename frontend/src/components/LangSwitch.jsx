import { useTranslation } from "react-i18next";

export default function LangSwitch() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  const toggle = () => {
    const next = isZh ? "en" : "zh";
    i18n.changeLanguage(next);
    localStorage.setItem("onetools-lang", next);
  };

  return (
    <button
      onClick={toggle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-card-hover)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-card)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        color: "var(--text-secondary)",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: -0.1,
        transition: "all 0.15s ease",
      }}
    >
      {isZh ? "EN" : "中文"}
    </button>
  );
}
