import { useTranslation } from "react-i18next";
import ToolCard from "../components/ToolCard";

const LIVE_TOOLS = [
  { nameKey: "tools.jsonFormatter.name", descKey: "tools.jsonFormatter.desc", icon: "{ }", color: "#1D9E75", to: "/tools/json" },
];

const UPCOMING_TOOLS = [
  { nameKey: "upcoming.regexTester", icon: "/./", color: "#534AB7" },
  { nameKey: "upcoming.base64Codec", icon: "B64", color: "#378ADD" },
  { nameKey: "upcoming.jwtDecoder", icon: "JWT", color: "#BA7517" },
  { nameKey: "upcoming.hashGenerator", icon: "#", color: "#1D9E75" },
  { nameKey: "upcoming.urlParser", icon: "://", color: "#D4537E" },
  { nameKey: "upcoming.diffChecker", icon: "≠", color: "#E8593C" },
];

export default function Home() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 28px" }}>
      {/* Hero */}
      <div style={{ padding: "60px 0 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.8 }}>
          {t("home.title")}
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 10, maxWidth: 480, margin: "10px auto 0" }}>
          {t("home.subtitle")}
        </p>
      </div>

      {/* Live Tools */}
      <div style={{ paddingBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 14 }}>
          {t("home.liveTools")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {LIVE_TOOLS.map((tool, i) => (
            <ToolCard
              key={i}
              name={t(tool.nameKey)}
              desc={t(tool.descKey)}
              icon={tool.icon}
              color={tool.color}
              to={tool.to}
            />
          ))}
        </div>
      </div>

      {/* Upcoming Tools */}
      <div style={{ paddingBottom: 60, borderTop: "1px solid var(--border-light)", paddingTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>{t("home.upcomingTools")}</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              {t("home.upcomingDesc")}
            </p>
          </div>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: "var(--bg-input)",
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {UPCOMING_TOOLS.length} in queue
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {UPCOMING_TOOLS.map((tool, i) => (
            <ToolCard
              key={i}
              name={t(tool.nameKey)}
              desc={t("upcoming.comingSoon")}
              icon={tool.icon}
              color={tool.color}
              comingSoon
            />
          ))}
        </div>
      </div>
    </div>
  );
}
