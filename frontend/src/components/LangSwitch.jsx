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
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.6)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "rgba(255,255,255,0.6)",
        color: "var(--text-secondary)",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: -0.1,
        backdropFilter: "blur(8px)",
        transition: "all 0.15s ease",
      }}
    >
      {isZh ? "EN" : "中文"}
    </button>
  );
}
