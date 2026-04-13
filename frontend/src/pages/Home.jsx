import { useTranslation } from "react-i18next";
import ToolCard from "../components/ToolCard";

const LIVE_TOOLS = [
  {
    nameKey: "tools.jsonFormatter.name",
    descKey: "tools.jsonFormatter.desc",
    icon: "{ }",
    color: "#00e5ff",
    to: "/tools/json",
  },
];

const UPCOMING_TOOLS = [
  { nameKey: "upcoming.regexTester", icon: "/./", color: "#8b7dff" },
  { nameKey: "upcoming.base64Codec", icon: "B64", color: "#5eb0ff" },
  { nameKey: "upcoming.jwtDecoder", icon: "JWT", color: "#ffb547" },
  { nameKey: "upcoming.hashGenerator", icon: "#", color: "#10f4a8" },
  { nameKey: "upcoming.urlParser", icon: "://", color: "#ff7fb7" },
  { nameKey: "upcoming.diffChecker", icon: "≠", color: "#ff4d6d" },
];

export default function Home() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        padding: "0 28px",
      }}
    >
      {/* ── Hero ───────────────────────────────── */}
      <section
        style={{
          padding: "80px 0 50px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Pre-title badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 20,
            border: "1px solid var(--border-strong)",
            background: "rgba(0,229,255,0.04)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--accent-text)",
            letterSpacing: 2,
            marginBottom: 28,
            boxShadow: "inset 0 0 12px rgba(0,229,255,0.1)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
            }}
          />
          v1.0.0 · DEVELOPER TOOLKIT
        </div>

        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            background:
              "linear-gradient(135deg, #ffffff 0%, #7ff1ff 45%, #b8afff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 30px rgba(0,229,255,0.25))",
          }}
        >
          {t("home.title")}
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            marginTop: 18,
            maxWidth: 560,
            margin: "18px auto 0",
            lineHeight: 1.7,
            fontFamily: "var(--font-sans)",
          }}
        >
          {t("home.subtitle")}
        </p>

        {/* terminal prompt decoration */}
        <div
          style={{
            marginTop: 34,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 10,
            background: "rgba(6,10,20,0.7)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ color: "var(--accent-3)" }}>~/onetools</span>
          <span style={{ color: "var(--text-muted)" }}>$</span>
          <span style={{ color: "var(--text-primary)" }}>run</span>
          <span
            style={{
              color: "var(--accent)",
              animation: "flicker 1.4s steps(4) infinite",
            }}
          >
            --all
          </span>
          <span
            style={{
              width: 8,
              height: 16,
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
              animation: "pulse 1s ease infinite",
            }}
          />
        </div>
      </section>

      {/* ── Live Tools ──────────────────────────── */}
      <section style={{ paddingBottom: 48 }}>
        <SectionHeading
          index="01"
          title={t("home.liveTools")}
          badge={`${LIVE_TOOLS.length} ACTIVE`}
          badgeColor="#10f4a8"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 14,
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
          paddingBottom: 80,
          paddingTop: 36,
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <SectionHeading
          index="02"
          title={t("home.upcomingTools")}
          desc={t("home.upcomingDesc")}
          badge={`${UPCOMING_TOOLS.length} IN QUEUE`}
          badgeColor="#8b7dff"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
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

function SectionHeading({ index, title, desc, badge, badgeColor }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 18,
        flexWrap: "wrap",
        gap: 14,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            color: "var(--accent-text)",
            fontFamily: "var(--font-mono)",
            letterSpacing: 3,
            marginBottom: 6,
            opacity: 0.7,
          }}
        >
          § {index}
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: -0.3,
          }}
        >
          {title}
        </h2>
        {desc && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginTop: 4,
              fontFamily: "var(--font-mono)",
            }}
          >
            {desc}
          </p>
        )}
      </div>
      {badge && (
        <span
          style={{
            padding: "5px 12px",
            borderRadius: 20,
            background: `${badgeColor}12`,
            border: `1px solid ${badgeColor}40`,
            fontSize: 11,
            color: badgeColor,
            fontFamily: "var(--font-mono)",
            letterSpacing: 1.5,
            boxShadow: `inset 0 0 10px ${badgeColor}15`,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
