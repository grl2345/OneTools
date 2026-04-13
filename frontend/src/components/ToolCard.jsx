import { Link } from "react-router-dom";

export default function ToolCard({ name, desc, icon, color, to, comingSoon }) {
  const content = (
    <div
      style={{
        position: "relative",
        padding: "20px 20px",
        borderRadius: "var(--radius)",
        background: comingSoon ? "rgba(19,19,22,0.5)" : "var(--bg-card)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: comingSoon ? 0.55 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition:
          "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          e.currentTarget.style.background = "var(--bg-subtle)";
          e.currentTarget.style.borderColor = "var(--border-strong)";
          const arrow = e.currentTarget.querySelector("[data-arrow]");
          if (arrow) arrow.style.transform = "translateX(3px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = comingSoon
          ? "rgba(19,19,22,0.5)"
          : "var(--bg-card)";
        e.currentTarget.style.borderColor = "var(--border)";
        const arrow = e.currentTarget.querySelector("[data-arrow]");
        if (arrow) arrow.style.transform = "translateX(0)";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: color,
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          flexShrink: 0,
          letterSpacing: -0.3,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.2,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {name}
          {!comingSoon && (
            <span
              style={{
                fontSize: 10,
                color: "var(--green)",
                padding: "2px 7px",
                borderRadius: 999,
                background: "var(--green-soft)",
                letterSpacing: 0,
                fontWeight: 600,
              }}
            >
              Live
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-muted)",
            marginTop: 3,
            letterSpacing: -0.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {desc}
        </div>
      </div>

      {!comingSoon && (
        <span
          data-arrow
          style={{
            color: "var(--text-muted)",
            fontSize: 16,
            transition: "transform 0.2s ease",
          }}
        >
          →
        </span>
      )}
    </div>
  );

  if (comingSoon || !to) return content;
  return (
    <Link to={to} style={{ textDecoration: "none", display: "block" }}>
      {content}
    </Link>
  );
}
