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
      style={{
        padding: "4px 12px",
        borderRadius: 20,
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        color: "var(--text-secondary)",
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
      }}
    >
      {isZh ? "EN" : "中文"}
    </button>
  );
}
