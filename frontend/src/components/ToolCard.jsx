import { Link } from "react-router-dom";

export default function ToolCard({ name, desc, icon, color, to, comingSoon }) {
  const content = (
    <div
      style={{
        position: "relative",
        padding: "18px 18px",
        borderRadius: "var(--radius)",
        background: comingSoon ? "#fcfcfd" : "#ffffff",
        border: "1px solid var(--border)",
        boxShadow: comingSoon ? "none" : "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: comingSoon ? 0.7 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          e.currentTarget.style.boxShadow = "var(--shadow-lg)";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.background = "#ffffff";
          const arrow = e.currentTarget.querySelector("[data-arrow]");
          if (arrow) {
            arrow.style.transform = "translateX(3px)";
            arrow.style.color = color;
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = comingSoon
          ? "none"
          : "var(--shadow-sm)";
        e.currentTarget.style.background = comingSoon ? "#fcfcfd" : "#ffffff";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--border)";
        const arrow = e.currentTarget.querySelector("[data-arrow]");
        if (arrow) {
          arrow.style.transform = "translateX(0)";
          arrow.style.color = "var(--text-faint)";
        }
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: color,
          fontWeight: 700,
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
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.25)",
                letterSpacing: 0.2,
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
            color: "var(--text-secondary)",
            marginTop: 3,
            fontWeight: 450,
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
            color: "var(--text-faint)",
            fontSize: 17,
            transition: "transform 0.2s ease, color 0.2s ease",
            fontWeight: 300,
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
