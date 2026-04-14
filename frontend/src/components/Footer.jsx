import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  const linkStyle = {
    fontSize: 13,
    color: "var(--text-muted)",
    fontWeight: 500,
    letterSpacing: -0.1,
    textDecoration: "none",
    display: "block",
    padding: "4px 0",
  };

  const colTitle = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.6,
    color: "var(--text-primary)",
    textTransform: "uppercase",
    marginBottom: 14,
  };

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-light)",
        padding: "56px 28px 40px",
        background:
          "linear-gradient(180deg, transparent 0%, rgba(168, 85, 247, 0.04) 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
          gap: 40,
        }}
      >
        <div>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              marginBottom: 14,
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
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 14.5L9.5 9l3.5 3.5L20 5"
                  stroke="#fff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: -0.4,
              }}
            >
              {t("nav.brand")}
            </span>
          </Link>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              maxWidth: 320,
            }}
          >
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <div style={colTitle}>{t("footer.col.product")}</div>
          <Link to="/tools/remove-watermark" style={linkStyle}>
            {t("tools.removeWatermark.name")}
          </Link>
          <Link to="/tools/remove-bg" style={linkStyle}>
            {t("tools.removeBg.name")}
          </Link>
          <Link to="/tools/upscale" style={linkStyle}>
            {t("tools.upscale.name")}
          </Link>
          <Link to="/tools/id-photo" style={linkStyle}>
            {t("tools.idPhoto.name")}
          </Link>
          <Link to="/" style={linkStyle}>
            {t("nav.allTools")}
          </Link>
        </div>

        <div>
          <div style={colTitle}>{t("footer.col.company")}</div>
          <Link to="/about" style={linkStyle}>
            {t("footer.about")}
          </Link>
          <Link to="/privacy" style={linkStyle}>
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" style={linkStyle}>
            {t("footer.terms")}
          </Link>
        </div>

        <div>
          <div style={colTitle}>{t("footer.col.follow")}</div>
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

      <div
        style={{
          maxWidth: 1200,
          margin: "40px auto 0",
          paddingTop: 24,
          borderTop: "1px solid var(--border-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            letterSpacing: -0.05,
          }}
        >
          © 2026 OneTools · {t("footer.builtWith")}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            letterSpacing: -0.05,
          }}
        >
          {t("footer.legalLine")}
        </div>
      </div>
    </footer>
  );
}
