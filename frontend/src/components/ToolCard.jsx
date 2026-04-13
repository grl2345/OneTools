import { Link } from "react-router-dom";

export default function ToolCard({ name, desc, icon, color, to, comingSoon }) {
  const content = (
    <div
      style={{
        padding: "20px",
        borderRadius: "var(--radius)",
        background: "var(--bg-card)",
        border: comingSoon ? "1px dashed var(--border)" : "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: comingSoon ? 0.55 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: `${color}12`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: color,
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            marginTop: 2,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );

  if (comingSoon || !to) return content;
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
}
