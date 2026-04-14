import { Link } from "react-router-dom";
import ToolIcon from "./ToolIcon";

// Tag styles shared across cards. Rendered as small outline pills.
const tagStyle = {
  padding: "2px 8px",
  borderRadius: 5,
  fontSize: 11,
  fontWeight: 500,
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  background: "#ffffff",
  letterSpacing: -0.1,
  whiteSpace: "nowrap",
  lineHeight: "17px",
};

const primaryTagStyle = (accent) => ({
  ...tagStyle,
  background: `${accent}10`,
  color: accent,
  border: `1px solid ${accent}33`,
});

export default function ToolCard({
  name,
  desc,
  iconName,
  accent = "#5b5bf5",
  tags = [],
  to,
  comingSoon,
}) {
  const content = (
    <div
      style={{
        position: "relative",
        padding: "14px 16px",
        borderRadius: 12,
        background: "#ffffff",
        border: "1px solid var(--border)",
        opacity: comingSoon ? 0.5 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          const el = e.currentTarget;
          el.style.borderColor = `${accent}55`;
          el.style.boxShadow = `0 0 0 1px ${accent}18, 0 4px 16px -4px ${accent}22`;
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--border)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Header: icon + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: `${accent}14`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ToolIcon name={iconName} size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
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
        </div>
      </div>

      {/* Description */}
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

      {/* Tag row */}
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
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
