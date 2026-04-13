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
        padding: "14px 24px",
        borderBottom: "1px solid var(--border-light)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10, 10, 11, 0.72)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background:
              "linear-gradient(135deg, #ffffff 0%, #c9c9cc 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#0a0a0b",
            fontFamily: "var(--font-sans)",
            letterSpacing: -0.5,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.2) inset, 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          ◎
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            letterSpacing: -0.3,
          }}
        >
          {t("nav.brand")}
        </span>
      </Link>

      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Link
          to="/"
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            fontWeight: 500,
            letterSpacing: -0.1,
          }}
        >
          {t("nav.allTools")}
        </Link>
        <LangSwitch />
      </div>
    </nav>
  );
}
