import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Sections map to the scroll anchors in Home.jsx category sections.
const SECTIONS = [
  { id: "text",  titleKey: "home.cat.text",  accent: "#5b5bf5" },
  { id: "doc",   titleKey: "home.cat.doc",   accent: "#ff6b35" },
  { id: "image", titleKey: "home.cat.image", accent: "#8b5cf6" },
  { id: "av",    titleKey: "home.cat.av",    accent: "#06b6d4" },
  { id: "util",  titleKey: "home.cat.util",  accent: "#059669" },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isZh = i18n.language === "zh";
  const onHome = location.pathname === "/";
  const currentHash = location.hash;

  const toggleLang = () => {
    const next = isZh ? "en" : "zh";
    i18n.changeLanguage(next);
    localStorage.setItem("onetools-lang", next);
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-faint)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    padding: "0 14px",
    marginTop: 20,
    marginBottom: 6,
  };

  const linkBase = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 13.5,
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontWeight: 500,
    letterSpacing: -0.1,
    transition: "background 0.12s ease, color 0.12s ease",
    position: "relative",
  };

  const activeStyle = {
    background: "rgba(91,91,245,0.08)",
    color: "var(--brand)",
  };

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
        background: "#fbfbfd",
        borderRight: "1px solid var(--border-light)",
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 18px 16px",
          borderBottom: "1px solid var(--border-light)",
          textDecoration: "none",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="9.25" stroke="var(--text-primary)" strokeWidth="1.8" />
          <circle cx="11" cy="11" r="3" fill="#5b5bf5" />
        </svg>
        <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)", letterSpacing: -0.4 }}>
          {t("nav.brand")}
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
        <div style={sectionLabel}>{t("sidebar.sec_home")}</div>
        <Link
          to="/"
          style={{
            ...linkBase,
            ...(onHome && !currentHash ? activeStyle : {}),
          }}
          onMouseEnter={(e) => {
            if (!onHome || currentHash) e.currentTarget.style.background = "rgba(17,24,39,0.04)";
          }}
          onMouseLeave={(e) => {
            if (!onHome || currentHash) e.currentTarget.style.background = "transparent";
          }}
        >
          <DotIcon />
          {t("sidebar.all")}
        </Link>

        <div style={sectionLabel}>{t("sidebar.sec_cat")}</div>
        {SECTIONS.map((s) => {
          const href = onHome ? `#cat-${s.id}` : `/#cat-${s.id}`;
          const isActive = onHome && currentHash === `#cat-${s.id}`;
          return (
            <a
              key={s.id}
              href={href}
              style={{
                ...linkBase,
                ...(isActive ? activeStyle : {}),
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(17,24,39,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: s.accent,
                  flexShrink: 0,
                }}
              />
              {t(s.titleKey)}
            </a>
          );
        })}

        <div style={sectionLabel}>{t("sidebar.sec_site")}</div>
        <Link
          to="/about"
          style={{
            ...linkBase,
            ...(location.pathname === "/about" ? activeStyle : {}),
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== "/about") e.currentTarget.style.background = "rgba(17,24,39,0.04)";
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== "/about") e.currentTarget.style.background = "transparent";
          }}
        >
          <BookIcon /> {t("footer.about")}
        </Link>
        <a
          href="https://github.com/grl2345/OneTools"
          target="_blank"
          rel="noopener noreferrer"
          style={linkBase}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(17,24,39,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <GithubIcon /> GitHub
        </a>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--border-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)" }}>
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
            border: "1px solid var(--border)",
            background: "#ffffff",
            color: "var(--text-secondary)",
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

function DotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2h10v10H2V2z M2 5h10 M5 2v10" />
    </svg>
  );
}
function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.7-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10z" />
    </svg>
  );
}
