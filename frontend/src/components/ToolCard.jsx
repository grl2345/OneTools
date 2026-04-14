import { Link } from "react-router-dom";
import ToolIcon from "./ToolIcon";

const tagStyle = {
  padding: "2px 8px",
  borderRadius: 5,
  fontSize: 10.5,
  fontWeight: 500,
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  background: "#fafbfd",
  letterSpacing: -0.05,
  whiteSpace: "nowrap",
  lineHeight: "16px",
};

const primaryTagStyle = (accent) => ({
  ...tagStyle,
  background: `${accent}14`,
  color: accent,
  border: `1px solid ${accent}33`,
});

export default function ToolCard({
  name,
  desc,
  iconName,
  accent = "#4f46e5",
  tags = [],
  to,
  comingSoon,
}) {
  const content = (
    <div
      style={{
        position: "relative",
        padding: "16px 18px",
        borderRadius: 14,
        background: "#ffffff",
        border: "1px solid var(--border)",
        opacity: comingSoon ? 0.5 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition:
          "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          const el = e.currentTarget;
          el.style.borderColor = "#84cc16";
          el.style.boxShadow = "0 0 0 1px #84cc16, 0 4px 14px -4px rgba(132,204,22,0.3)";
          el.style.background = "#fafffb";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--border)";
        el.style.boxShadow = "none";
        el.style.background = "#ffffff";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: `${accent}14`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ToolIcon name={iconName} size={19} />
        </div>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.25,
            flex: 1,
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: "var(--text-muted)",
          lineHeight: 1.55,
          fontWeight: 400,
          letterSpacing: -0.05,
          flex: 1,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {desc}
      </div>

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: "auto" }}>
          {tags.map((tag, i) => (
            <span key={i} style={i === 0 ? primaryTagStyle(accent) : tagStyle}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (comingSoon || !to) return content;
  return (
    <Link to={to} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      {content}
    </Link>
  );
}
