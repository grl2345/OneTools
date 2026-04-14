import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HomeIcon,
  ToolsIcon,
  PrivacyIcon,
  DocIcon,
  ImageIcon,
  PlayIcon,
  CodeIcon,
  InfoIcon,
  GithubIcon,
  SparkleIcon,
} from "./SidebarIcons";

const BROWSE_SUB = [
  { id: "all",     labelKey: "sidebar.all",       icon: HomeIcon },
  { id: "privacy", labelKey: "home.cat.privacy",  icon: PrivacyIcon },
  { id: "doc",     labelKey: "home.cat.doc",      icon: DocIcon },
  { id: "image",   labelKey: "home.cat.image",    icon: ImageIcon },
  { id: "av",      labelKey: "home.cat.av",       icon: PlayIcon },
  { id: "dev",     labelKey: "home.cat.dev",      icon: CodeIcon },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isZh = i18n.language === "zh";
  const onHome = location.pathname === "/";

  const toggleLang = () => {
    const next = isZh ? "en" : "zh";
    i18n.changeLanguage(next);
    localStorage.setItem("onetools-lang", next);
  };

  const sectionLabel = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
    padding: "18px 18px 8px",
  };

  const navItem = (active, level = 0) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: level === 0 ? "9px 14px" : "8px 14px 8px 38px",
    margin: "2px 10px",
    borderRadius: 8,
    fontSize: 13.5,
    color: active ? "#0f172a" : "#475569",
    textDecoration: "none",
    fontWeight: active ? 600 : 500,
    letterSpacing: -0.1,
    background: active ? "#f1f5f9" : "transparent",
    transition: "background 0.12s ease, color 0.12s ease",
    cursor: "pointer",
    border: "none",
    width: "calc(100% - 20px)",
    textAlign: "left",
  });

  return (
    <aside
      className="app-sidebar"
      style={{
        width: 232,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      {/* Brand header — lime green gradient (Aloom signature) */}
      <Link
        to="/"
        style={{
          padding: "22px 20px 18px",
          background:
            "linear-gradient(135deg, #d9f99d 0%, #bef264 100%)",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#0f172a" />
          <circle cx="12" cy="12" r="4.5" fill="#bef264" />
        </svg>
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: -0.6,
          }}
        >
          {t("nav.brand")}
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        <div style={sectionLabel}>{t("sidebar.sec_browse")}</div>

        <Link
          to="/"
          style={navItem(onHome && !location.hash)}
        >
          <span style={{ color: "#475569", display: "inline-flex" }}>
            <HomeIcon />
          </span>
          {t("sidebar.sec_home")}
        </Link>

        <div
          style={{
            ...navItem(false),
            background: "transparent",
            cursor: "default",
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          <span style={{ color: "#475569", display: "inline-flex" }}>
            <ToolsIcon />
          </span>
          {t("sidebar.tools")}
          <span
            style={{
              marginLeft: "auto",
              padding: "2px 8px",
              borderRadius: 999,
              background: "#bef264",
              color: "#0f172a",
              fontSize: 10.5,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            24
          </span>
        </div>

        {BROWSE_SUB.map((s) => (
          <Link
            key={s.id}
            to={s.id === "all" ? "/" : `/?cat=${s.id}`}
            style={navItem(false, 1)}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ color: "#94a3b8", display: "inline-flex" }}>
              <s.icon />
            </span>
            {t(s.labelKey)}
          </Link>
        ))}

        <div style={sectionLabel}>{t("sidebar.sec_more")}</div>

        <Link
          to="/about"
          style={navItem(location.pathname === "/about")}
          onMouseEnter={(e) => {
            if (location.pathname !== "/about")
              e.currentTarget.style.background = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== "/about")
              e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ color: "#475569", display: "inline-flex" }}>
            <InfoIcon />
          </span>
          {t("footer.about")}
        </Link>

        <a
          href="https://github.com/grl2345/OneTools"
          target="_blank"
          rel="noopener noreferrer"
          style={navItem(false)}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ color: "#475569", display: "inline-flex" }}>
            <GithubIcon />
          </span>
          GitHub
        </a>
      </nav>

      {/* Bottom help card — Aloom signature lime gradient card */}
      <div style={{ padding: "14px 14px 16px" }}>
        <a
          href="https://github.com/grl2345/OneTools/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            padding: "16px 16px 18px",
            borderRadius: 16,
            background:
              "linear-gradient(135deg, #bef264 0%, #86efac 100%)",
            textDecoration: "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#0f172a",
              color: "#bef264",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SparkleIcon />
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "#0f172a",
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 4,
              opacity: 0.7,
            }}
          >
            {t("sidebar.tipLabel")}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: -0.3,
              lineHeight: 1.2,
            }}
          >
            {t("sidebar.tipTitle")}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "#0f172a",
              opacity: 0.65,
              fontWeight: 500,
            }}
          >
            {t("sidebar.tipSub")}
          </div>
        </a>
      </div>

      {/* Bottom: lang switch + privacy/terms */}
      <div
        style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#94a3b8",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/privacy" style={{ color: "inherit", textDecoration: "none" }}>
            {t("footer.privacy")}
          </Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link to="/terms" style={{ color: "inherit", textDecoration: "none" }}>
            {t("footer.terms")}
          </Link>
        </div>
        <button
          onClick={toggleLang}
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#475569",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {isZh ? "EN" : "中"}
        </button>
      </div>
    </aside>
  );
}
