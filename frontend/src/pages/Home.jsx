import { useTranslation } from "react-i18next";
import ToolCard from "../components/ToolCard";

const LIVE_TOOLS = [
  {
    nameKey: "tools.jsonFormatter.name",
    descKey: "tools.jsonFormatter.desc",
    icon: "{ }",
    color: "#5b5bf5",
    to: "/tools/json",
  },
];

const UPCOMING_TOOLS = [
  { nameKey: "upcoming.regexTester", icon: "/./", color: "#8b5cf6" },
  { nameKey: "upcoming.base64Codec", icon: "B64", color: "#2563eb" },
  { nameKey: "upcoming.jwtDecoder", icon: "JWT", color: "#f59e0b" },
  { nameKey: "upcoming.hashGenerator", icon: "#", color: "#10b981" },
  { nameKey: "upcoming.urlParser", icon: "://", color: "#ec4899" },
  { nameKey: "upcoming.diffChecker", icon: "≠", color: "#ef4444" },
];

export default function Home() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        padding: "0 24px",
        position: "relative",
      }}
    >
      {/* ── Hero ──────────────────────────────── */}
      <section
        style={{
          padding: "100px 0 72px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* floating orbs */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 560,
            height: 320,
            background:
              "radial-gradient(closest-side, rgba(91,91,245,0.18), transparent)",
            filter: "blur(12px)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 5px 5px 12px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(8px)",
            fontSize: 12.5,
            color: "var(--text-secondary)",
            fontWeight: 500,
            marginBottom: 32,
            letterSpacing: -0.1,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              boxShadow: "0 0 0 3px rgba(16,185,129,0.18)",
            }}
          />
          v1.0 · Now available
          <span
            style={{
              padding: "2px 10px",
              borderRadius: 999,
              background: "var(--gradient-brand)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.1,
            }}
          >
            New
          </span>
        </div>

        <h1
          style={{
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -2.8,
            lineHeight: 1.02,
            color: "var(--text-primary)",
          }}
        >
          {t("home.title").split("").map((ch, i, arr) => {
            // Colorize the last ~3 chars with gradient (feels "tech")
            const gradientStart = Math.max(0, arr.length - 3);
            if (i >= gradientStart) {
              return (
                <span
                  key={i}
                  style={{
                    background: "var(--gradient-brand)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {ch}
                </span>
              );
            }
            return <span key={i}>{ch}</span>;
          })}
        </h1>

        <p
          style={{
            fontSize: 17.5,
            color: "var(--text-secondary)",
            marginTop: 22,
            maxWidth: 580,
            margin: "22px auto 0",
            lineHeight: 1.55,
            fontWeight: 400,
            letterSpacing: -0.2,
          }}
        >
          {t("home.subtitle")}
        </p>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 32,
            flexWrap: "wrap",
          }}
        >
          <a
            href="#live"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 999,
              background: "var(--text-primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.1,
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 14px rgba(10,11,16,0.2)",
            }}
          >
            Get started →
          </a>
          <a
            href="#upcoming"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
              color: "var(--text-primary)",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.1,
              border: "1px solid var(--border)",
            }}
          >
            Roadmap
          </a>
        </div>
      </section>

      {/* ── Live Tools ─────────────────────────── */}
      <section id="live" style={{ paddingBottom: 56 }}>
        <SectionHeading
          title={t("home.liveTools")}
          badge={`${LIVE_TOOLS.length} active`}
          accent="var(--green)"
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
        id="upcoming"
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

function SectionHeading({ title, desc, badge, accent }) {
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
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: -0.8,
          }}
        >
          {title}
        </h2>
        {desc && (
          <p
            style={{
              fontSize: 14,
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
            background: accent ? `${accent}14` : "rgba(255,255,255,0.7)",
            border: `1px solid ${accent ? accent + "33" : "var(--border)"}`,
            fontSize: 11.5,
            color: accent || "var(--text-muted)",
            fontWeight: 600,
            letterSpacing: -0.05,
            backdropFilter: "blur(8px)",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
