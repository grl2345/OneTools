import { Link } from "react-router-dom";
import ToolIcon from "./ToolIcon";

/**
 * Monochrome, Apple-like tool card. All tools share the same icon treatment
 * (stroke-drawn SF-Symbols-style, neutral color at rest, brand color on
 * hover). No pastel tinted backgrounds per tool.
 */
export default function ToolCard({ name, desc, iconName, to, comingSoon }) {
  const content = (
    <div
      style={{
        position: "relative",
        padding: "16px 18px",
        borderRadius: 14,
        background: "#ffffff",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: comingSoon ? 0.5 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition: "border-color 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          e.currentTarget.style.borderColor = "rgba(17,24,39,0.22)";
          const ic = e.currentTarget.querySelector("[data-icon-wrap]");
          if (ic) {
            ic.style.background = "var(--text-primary)";
            ic.style.color = "#ffffff";
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        const ic = e.currentTarget.querySelector("[data-icon-wrap]");
        if (ic) {
          ic.style.background = "var(--bg-subtle)";
          ic.style.color = "var(--text-primary)";
        }
      }}
    >
      <div
        data-icon-wrap
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "var(--bg-subtle)",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.18s ease, color 0.18s ease",
        }}
      >
        <ToolIcon name={iconName} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-muted)",
            marginTop: 3,
            fontWeight: 400,
            letterSpacing: -0.05,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );

  if (comingSoon || !to) return content;
  return (
    <Link to={to} style={{ textDecoration: "none", display: "block" }}>
      {content}
    </Link>
  );
}
