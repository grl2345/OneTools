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
        background: "rgba(250, 251, 252, 0.88)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          textDecoration: "none",
        }}
      >
        {/* Brand mark — dark ring with an indigo dot inside.
            Ring stays neutral, dot gives the brand a single quiet accent. */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle
            cx="11"
            cy="11"
            r="9.25"
            stroke="var(--text-primary)"
            strokeWidth="1.8"
          />
          <circle cx="11" cy="11" r="3" fill="#5b5bf5" />
        </svg>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.5,
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
