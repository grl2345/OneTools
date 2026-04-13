import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LangSwitch from "./LangSwitch";

export default function Navbar() {
  const { t } = useTranslation();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 28px",
        borderBottom: "1px solid var(--border-light)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(5, 7, 13, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* bottom neon line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -1,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.55) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <Link
        to="/"
        style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background:
              "linear-gradient(135deg, rgba(0,229,255,0.18) 0%, rgba(109,91,255,0.18) 100%)",
            border: "1px solid rgba(0,229,255,0.4)",
            boxShadow:
              "0 0 18px rgba(0,229,255,0.35), inset 0 0 12px rgba(109,91,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#7ff1ff",
            fontFamily: "var(--font-mono)",
            letterSpacing: -0.5,
          }}
        >
          {"⌘_"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              letterSpacing: 0.3,
            }}
          >
            {t("nav.brand")}
          </span>
          <span
            style={{
              fontSize: 9,
              color: "var(--accent-text)",
              fontFamily: "var(--font-mono)",
              letterSpacing: 2,
              marginTop: 3,
              textTransform: "uppercase",
              opacity: 0.75,
            }}
          >
            DEV · CONSOLE
          </span>
        </div>
      </Link>

      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid rgba(16,244,168,0.25)",
            background: "rgba(16,244,168,0.06)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "#7ff3c7",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#10f4a8",
              boxShadow: "0 0 8px #10f4a8",
              animation: "pulse 1.6s ease infinite",
            }}
          />
          ONLINE
        </div>

        <Link
          to="/"
          style={{
            fontSize: 12.5,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            textDecoration: "none",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          ./{t("nav.allTools")}
        </Link>
        <LangSwitch />
      </div>
    </nav>
  );
}
