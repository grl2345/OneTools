import { Link } from "react-router-dom";
import ToolIcon from "./ToolIcon";

/**
 * Apple-style tool card. Icons are stroke-drawn SF-Symbols-style; all tools
 * in the same category share one accent color. The icon container uses a
 * soft tinted background (accent at ~10% alpha) with the icon stroke at
 * full accent color — reads as considered, not chaotic.
 */
export default function ToolCard({
  name,
  desc,
  iconName,
  accent = "#5b5bf5",
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
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: comingSoon ? 0.5 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition: "border-color 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          const el = e.currentTarget;
          el.style.borderColor = `${accent}40`;
          el.style.boxShadow = `0 0 0 1px ${accent}10, 0 6px 20px -8px ${accent}28`;
          const ic = el.querySelector("[data-icon-wrap]");
          if (ic) {
            ic.style.background = `${accent}1f`;
          }
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--border)";
        el.style.boxShadow = "none";
        const ic = el.querySelector("[data-icon-wrap]");
        if (ic) {
          ic.style.background = `${accent}12`;
        }
      }}
    >
      <div
        data-icon-wrap
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${accent}12`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.18s ease",
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
