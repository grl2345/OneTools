import { useState } from "react";

/**
 * SEO-friendly FAQ section. Renders a clean accordion visually. The
 * schema.org FAQPage JSON-LD that used to live here is now baked into
 * the prerendered HTML by scripts/prerender.js (so non-JS crawlers see
 * it on first response). Emitting it here too would duplicate the
 * structured data Google sees.
 */
export default function FaqSection({ title, items }) {
  const [open, setOpen] = useState(0);

  return (
    <>
      <section
        style={{
          width: "100%",
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
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
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
                  background: open === i ? "rgba(168,85,247,0.08)" : "transparent",
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
