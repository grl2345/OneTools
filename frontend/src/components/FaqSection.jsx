import { useState } from "react";
import { Helmet } from "react-helmet-async";

/**
 * SEO-friendly FAQ section. Renders a clean accordion visually, and emits
 * schema.org FAQPage JSON-LD so Google / AI search engines can parse Q&A
 * pairs directly. Great for ranking on long-tail "is this free / does it
 * upload / vs X" queries.
 */
export default function FaqSection({ title, items, path }) {
  const [open, setOpen] = useState(0);

  const structured = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structured)}
        </script>
      </Helmet>
      <section
        style={{
          maxWidth: 840,
          margin: "0 auto",
          padding: "32px 0 64px",
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.6,
            marginBottom: 6,
          }}
        >
          {title}
        </h2>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 20,
          }}
        >
          {items.length} Q&amp;A
        </div>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                borderBottom:
                  i < items.length - 1 ? "1px solid var(--border-light)" : "none",
              }}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "16px 20px",
                  background: open === i ? "#fafbfc" : "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: -0.15,
                  transition: "background 0.15s ease",
                }}
              >
                <span>{it.q}</span>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 18,
                    transform: open === i ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 0.2s ease",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div
                  style={{
                    padding: "0 20px 16px",
                    fontSize: 13.5,
                    color: "var(--text-secondary)",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {it.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
