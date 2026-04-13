import { Link } from "react-router-dom";

export default function ToolCard({ name, desc, icon, color, to, comingSoon }) {
  const content = (
    <div
      style={{
        position: "relative",
        padding: "18px 18px 18px 18px",
        borderRadius: "var(--radius)",
        background:
          "linear-gradient(160deg, rgba(14,20,36,0.78) 0%, rgba(8,12,22,0.78) 100%)",
        border: comingSoon
          ? "1px dashed rgba(110,200,255,0.12)"
          : "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: comingSoon ? 0.6 : 1,
        cursor: comingSoon ? "default" : "pointer",
        transition: "all 0.25s ease",
        overflow: "hidden",
        backdropFilter: "blur(6px)",
      }}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = `0 0 0 1px ${color}40, 0 10px 30px ${color}25, inset 0 0 26px ${color}0d`;
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* corner brackets */}
      {!comingSoon && (
        <>
          <span style={cornerStyle("top-left", color)} />
          <span style={cornerStyle("top-right", color)} />
          <span style={cornerStyle("bottom-left", color)} />
          <span style={cornerStyle("bottom-right", color)} />
        </>
      )}

      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
          border: `1px solid ${color}55`,
          boxShadow: comingSoon
            ? "none"
            : `0 0 14px ${color}33, inset 0 0 10px ${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: color,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          flexShrink: 0,
          textShadow: `0 0 10px ${color}66`,
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
            fontFamily: "var(--font-sans)",
            letterSpacing: 0.2,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {name}
          {!comingSoon && (
            <span
              style={{
                fontSize: 9,
                color: "#10f4a8",
                fontFamily: "var(--font-mono)",
                padding: "2px 6px",
                borderRadius: 4,
                border: "1px solid rgba(16,244,168,0.35)",
                background: "rgba(16,244,168,0.08)",
                letterSpacing: 1,
              }}
            >
              LIVE
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            marginTop: 4,
            letterSpacing: 0.2,
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
          style={{
            color: color,
            fontSize: 18,
            fontFamily: "var(--font-mono)",
            opacity: 0.7,
            transition: "transform 0.2s",
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

function cornerStyle(pos, color) {
  const base = {
    position: "absolute",
    width: 10,
    height: 10,
    borderColor: `${color}88`,
    pointerEvents: "none",
  };
  const size = 10;
  if (pos === "top-left")
    return { ...base, top: 6, left: 6, borderTop: "1px solid", borderLeft: "1px solid" };
  if (pos === "top-right")
    return { ...base, top: 6, right: 6, borderTop: "1px solid", borderRight: "1px solid" };
  if (pos === "bottom-left")
    return { ...base, bottom: 6, left: 6, borderBottom: "1px solid", borderLeft: "1px solid" };
  if (pos === "bottom-right")
    return { ...base, bottom: 6, right: 6, borderBottom: "1px solid", borderRight: "1px solid" };
  return base;
}
