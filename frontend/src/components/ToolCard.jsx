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
        transition:
          "box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          const el = e.currentTarget;
          el.style.boxShadow = `0 10px 28px -10px ${color}40, 0 0 0 1px ${color}30, 0 1px 2px rgba(10,11,16,0.04)`;
          el.style.transform = "translateY(-2px)";
          el.style.borderColor = "transparent";
          const arrow = el.querySelector("[data-arrow]");
          if (arrow) {
            arrow.style.transform = "translateX(3px)";
            arrow.style.color = color;
          }
          const icn = el.querySelector("[data-icon]");
          if (icn) {
            icn.style.transform = "scale(1.06)";
          }
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = comingSoon ? "none" : "var(--shadow-sm)";
        el.style.transform = "translateY(0)";
        el.style.borderColor = "var(--border)";
        const arrow = el.querySelector("[data-arrow]");
        if (arrow) {
          arrow.style.transform = "translateX(0)";
          arrow.style.color = "var(--text-faint)";
        }
        const icn = el.querySelector("[data-icon]");
        if (icn) icn.style.transform = "scale(1)";
      }}
    >
      <div
        data-icon
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: `linear-gradient(135deg, ${color}22 0%, ${color}0a 100%)`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: color,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          flexShrink: 0,
          letterSpacing: -0.3,
          transition: "transform 0.2s ease",
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
            fontSize: 18,
            transition: "transform 0.2s ease, color 0.2s ease",
            fontWeight: 300,
            flexShrink: 0,
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
