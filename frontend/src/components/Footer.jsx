import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer
      style={{
        padding: "24px 28px",
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        borderTop: "1px solid var(--border-light)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -1,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(109,91,255,0.45) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          letterSpacing: 0.5,
        }}
      >
        <span style={{ color: "var(--accent)" }}>$</span> OneTools@2026 ::{" "}
        {t("footer.builtWith")}
      </span>
      <div style={{ display: "flex", gap: 18 }}>
        <a
          href="#"
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            letterSpacing: 0.5,
          }}
        >
          [GITHUB]
        </a>
      </div>
    </footer>
  );
}
