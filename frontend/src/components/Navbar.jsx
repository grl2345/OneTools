import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LangSwitch from "./LangSwitch";

export default function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const linkStyle = (active) => ({
    fontSize: 14,
    color: active ? "#ffffff" : "var(--text-secondary)",
    fontWeight: active ? 600 : 500,
    letterSpacing: -0.1,
    textDecoration: "none",
    padding: "6px 2px",
    transition: "color 0.15s ease",
  });

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 28px",
        borderBottom: "1px solid var(--border-light)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(11, 11, 20, 0.78)",
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
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px -2px rgba(168, 85, 247, 0.55)",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 14.5L9.5 9l3.5 3.5L20 5M20 5h-5M20 5v5"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 19h16"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -0.5,
          }}
        >
          {t("nav.brand")}
        </span>
      </Link>

      <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
        <Link to="/tools/remove-watermark" style={linkStyle(pathname === "/tools/remove-watermark")}>
          {t("nav.removeWatermark")}
        </Link>
        <Link to="/tools/remove-bg" style={linkStyle(pathname === "/tools/remove-bg")}>
          {t("nav.removeBg")}
        </Link>
        <Link to="/" style={linkStyle(pathname === "/")}>
          {t("nav.allTools")}
        </Link>
        <Link to="/about" style={linkStyle(pathname === "/about")}>
          {t("footer.about")}
        </Link>

        <a
          href="https://github.com/grl2345/OneTools"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          style={{
            color: "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.7-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10z" />
          </svg>
        </a>
        <LangSwitch />
        <Link to="/tools/remove-watermark" className="btn-primary" style={{ padding: "10px 20px", fontSize: 13.5 }}>
          {t("nav.tryFree")}
        </Link>
      </div>
    </nav>
  );
}
