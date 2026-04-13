import { Link } from "react-router-dom";

export default function ToolCard({ name, desc, icon, color, to, comingSoon }) {
  const content = (
    <div
      style={{
        position: "relative",
        padding: "16px 16px",
        borderRadius: 10,
        background: "#ffffff",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: comingSoon ? 0.55 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition: "border-color 0.12s ease, background 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.background = "#fbfbfc";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "#ffffff";
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${color}14`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12.5,
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
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.15,
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
            marginTop: 2,
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
