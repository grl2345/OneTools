/**
 * Shared layout for legal/static pages (Privacy / Terms / About).
 * Provides consistent typography, max-width, and spacing.
 */
export default function LegalLayout({ title, subtitle, lastUpdated, children }) {
  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "72px 24px 96px",
      }}
    >
      <h1
        style={{
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: -1.4,
          lineHeight: 1.1,
          color: "var(--text-primary)",
          marginBottom: 14,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            fontWeight: 450,
            letterSpacing: -0.15,
            marginBottom: lastUpdated ? 6 : 36,
          }}
        >
          {subtitle}
        </p>
      )}
      {lastUpdated && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-muted)",
            marginBottom: 36,
            fontFamily: "var(--font-mono)",
          }}
        >
          {lastUpdated}
        </div>
      )}
      <div className="legal-prose">{children}</div>
    </div>
  );
}
