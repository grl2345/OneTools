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
        background: "rgba(250, 251, 252, 0.72)",
        backdropFilter: "saturate(180%) blur(16px)",
        WebkitBackdropFilter: "saturate(180%) blur(16px)",
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
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: -0.5,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 12px rgba(91,91,245,0.35)",
          }}
        >
          ◎
        </div>
        <span
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: -0.4,
          }}
        >
          {t("nav.brand")}
        </span>
      </Link>

      <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
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
