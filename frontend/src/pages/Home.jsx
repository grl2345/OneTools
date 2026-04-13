import { useTranslation } from "react-i18next";
import ToolCard from "../components/ToolCard";

const LIVE_TOOLS = [
  {
    nameKey: "tools.jsonFormatter.name",
    descKey: "tools.jsonFormatter.desc",
    icon: "{ }",
    color: "#64d2ff",
    to: "/tools/json",
  },
];

const UPCOMING_TOOLS = [
  { nameKey: "upcoming.regexTester", icon: "/./", color: "#bf5af2" },
  { nameKey: "upcoming.base64Codec", icon: "B64", color: "#0a84ff" },
  { nameKey: "upcoming.jwtDecoder", icon: "JWT", color: "#ff9f0a" },
  { nameKey: "upcoming.hashGenerator", icon: "#", color: "#30d158" },
  { nameKey: "upcoming.urlParser", icon: "://", color: "#ff6482" },
  { nameKey: "upcoming.diffChecker", icon: "≠", color: "#ff453a" },
];

export default function Home() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      {/* ── Hero ─────────────────────────────────── */}
      <section
        style={{
          padding: "96px 0 72px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.03)",
            fontSize: 12,
            color: "var(--text-secondary)",
            fontWeight: 500,
            marginBottom: 28,
            letterSpacing: -0.1,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--green)",
              boxShadow: "0 0 0 3px rgba(48,209,88,0.15)",
            }}
          />
          v1.0 · Now available
        </div>

        <h1
          style={{
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: -2.2,
            lineHeight: 1.02,
            background:
              "linear-gradient(180deg, #ffffff 0%, #ffffff 55%, #a1a1a6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {t("home.title")}
        </h1>

        <p
          style={{
            fontSize: 17,
            color: "var(--text-secondary)",
            marginTop: 20,
            maxWidth: 560,
            margin: "20px auto 0",
            lineHeight: 1.55,
            fontWeight: 400,
            letterSpacing: -0.2,
          }}
        >
          {t("home.subtitle")}
        </p>
      </section>

      {/* ── Live Tools ─────────────────────────── */}
      <section style={{ paddingBottom: 56 }}>
        <SectionHeading
          title={t("home.liveTools")}
          badge={`${LIVE_TOOLS.length} active`}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 12,
          }}
        >
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
      </section>

      {/* ── Upcoming ───────────────────────────── */}
      <section
        style={{
          paddingBottom: 96,
          paddingTop: 36,
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <SectionHeading
          title={t("home.upcomingTools")}
          desc={t("home.upcomingDesc")}
          badge={`${UPCOMING_TOOLS.length} in queue`}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
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
      </section>
    </div>
  );
}

function SectionHeading({ title, desc, badge }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 18,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.6,
          }}
        >
          {title}
        </h2>
        {desc && (
          <p
            style={{
              fontSize: 13.5,
              color: "var(--text-muted)",
              marginTop: 4,
              fontWeight: 400,
              letterSpacing: -0.1,
            }}
          >
            {desc}
          </p>
        )}
      </div>
      {badge && (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            fontSize: 11.5,
            color: "var(--text-muted)",
            fontWeight: 500,
            letterSpacing: -0.1,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
