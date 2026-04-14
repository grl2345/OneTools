import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  const linkStyle = {
    fontSize: 12.5,
    color: "var(--text-muted)",
    fontWeight: 500,
    letterSpacing: -0.1,
    textDecoration: "none",
  };

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-light)",
        padding: "32px 28px 40px",
        background: "#fcfcfd",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 22 22"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="10" fill="#84cc16" />
            <circle cx="11" cy="11" r="4" fill="#ffffff" />
          </svg>
          <span
            style={{
              fontSize: 12.5,
              color: "var(--text-muted)",
              letterSpacing: -0.1,
            }}
          >
            © 2026 OneTools · {t("footer.builtWith")}
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link to="/about" style={linkStyle}>
            {t("footer.about")}
          </Link>
          <Link to="/privacy" style={linkStyle}>
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" style={linkStyle}>
            {t("footer.terms")}
          </Link>
          <a
            href="https://github.com/grl2345/OneTools"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
