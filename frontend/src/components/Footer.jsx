import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  const linkStyle = {
    fontSize: 12.5,
    color: "var(--text-muted)",
    fontWeight: 500,
    letterSpacing: -0.1,
  };

  return (
    <footer
      style={{
        padding: "32px 24px 40px",
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        borderTop: "1px solid var(--border-light)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          color: "var(--text-muted)",
          letterSpacing: -0.1,
        }}
      >
        © 2026 OneTools · {t("footer.builtWith")}
      </span>
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
    </footer>
  );
}
