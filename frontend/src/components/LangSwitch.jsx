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
        padding: "5px 14px",
        borderRadius: 20,
        border: "1px solid var(--border-strong)",
        background: "rgba(0,229,255,0.05)",
        color: "var(--accent-text)",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        letterSpacing: 1,
        boxShadow: "inset 0 0 8px rgba(0,229,255,0.12)",
      }}
    >
      {isZh ? "» EN" : "» 中文"}
    </button>
  );
}
