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
        background: "rgba(250, 251, 252, 0.85)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
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
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="9.25" stroke="var(--text-primary)" strokeWidth="1.8" />
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

      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Link
          to="/"
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            fontWeight: 500,
            letterSpacing: -0.1,
            textDecoration: "none",
          }}
        >
          {t("nav.allTools")}
        </Link>
        <Link
          to="/about"
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            fontWeight: 500,
            letterSpacing: -0.1,
            textDecoration: "none",
          }}
        >
          {t("footer.about")}
        </Link>
        <a
          href="https://github.com/grl2345/OneTools"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          style={{
            color: "var(--text-secondary)",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.7-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10z" />
          </svg>
        </a>
        <LangSwitch />
      </div>
    </nav>
  );
}
