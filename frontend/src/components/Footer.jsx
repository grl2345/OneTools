import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer
      style={{
        padding: "28px 24px",
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        borderTop: "1px solid var(--border-light)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
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
      <div style={{ display: "flex", gap: 18 }}>
        <a
          href="#"
          style={{
            fontSize: 12.5,
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
