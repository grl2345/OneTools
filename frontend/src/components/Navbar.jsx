import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LangSwitch from "./LangSwitch";

export default function Navbar() {
  const { t } = useTranslation();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 28px",
        borderBottom: "1px solid var(--border-light)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(248,249,251,0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "var(--font-mono)",
          }}
        >
          {"{ }"}
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            letterSpacing: -0.3,
          }}
        >
          {t("nav.brand")}
        </span>
      </Link>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link
          to="/"
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
            textDecoration: "none",
          }}
        >
          {t("nav.allTools")}
        </Link>
        <LangSwitch />
      </div>
    </nav>
  );
}
