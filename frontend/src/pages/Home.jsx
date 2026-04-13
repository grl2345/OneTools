import { useTranslation } from "react-i18next";
import ToolCard from "../components/ToolCard";
import SEO, { schema } from "../components/SEO";

/**
 * Tools are now grouped into 5 categories so a 24-tool grid no longer feels
 * overwhelming. Each category gets its own labelled section with a colored
 * dot + count. Order matters: each tool appears in exactly one category.
 */
const CATEGORIES = [
  {
    id: "ai-text",
    titleKey: "home.cat.ai_text",
    descKey: "home.cat.ai_text_desc",
    accent: "#5b5bf5",
    tools: [
      { nameKey: "tools.jsonFormatter.name",   descKey: "tools.jsonFormatter.desc",   icon: "{ }", color: "#5b5bf5", to: "/tools/json" },
      { nameKey: "tools.markdownPreview.name", descKey: "tools.markdownPreview.desc", icon: "MD",  color: "#14b8a6", to: "/tools/markdown" },
      { nameKey: "tools.naming.name",          descKey: "tools.naming.desc",          icon: "Aa",  color: "#8b5cf6", to: "/tools/naming" },
      { nameKey: "tools.cron.name",            descKey: "tools.cron.desc",            icon: "* *", color: "#10b981", to: "/tools/cron" },
      { nameKey: "tools.timestamp.name",       descKey: "tools.timestamp.desc",       icon: "⏱",   color: "#ec4899", to: "/tools/timestamp" },
      { nameKey: "tools.flowchart.name",       descKey: "tools.flowchart.desc",       icon: "→◇",  color: "#14b8a6", to: "/tools/flowchart" },
    ],
  },
  {
    id: "ai-doc",
    titleKey: "home.cat.ai_doc",
    descKey: "home.cat.ai_doc_desc",
    accent: "#ef4444",
    tools: [
      { nameKey: "tools.pdfSummary.name",   descKey: "tools.pdfSummary.desc",   icon: "PDF", color: "#ef4444", to: "/tools/pdf-summary" },
      { nameKey: "tools.ocr.name",          descKey: "tools.ocr.desc",          icon: "🔤",  color: "#6366f1", to: "/tools/ocr" },
      { nameKey: "tools.handwriting.name",  descKey: "tools.handwriting.desc",  icon: "✍",   color: "#d946ef", to: "/tools/handwriting" },
      { nameKey: "tools.imageToTable.name", descKey: "tools.imageToTable.desc", icon: "▦",   color: "#10b981", to: "/tools/image-to-table" },
    ],
  },
  {
    id: "ai-media",
    titleKey: "home.cat.ai_media",
    descKey: "home.cat.ai_media_desc",
    accent: "#8b5cf6",
    tools: [
      { nameKey: "tools.removeBg.name",        descKey: "tools.removeBg.desc",        icon: "✂︎",  color: "#8b5cf6", to: "/tools/remove-bg" },
      { nameKey: "tools.removeWatermark.name", descKey: "tools.removeWatermark.desc", icon: "WM",  color: "#2563eb", to: "/tools/remove-watermark" },
      { nameKey: "tools.idPhoto.name",         descKey: "tools.idPhoto.desc",         icon: "📸",  color: "#f59e0b", to: "/tools/id-photo" },
      { nameKey: "tools.upscale.name",         descKey: "tools.upscale.desc",         icon: "🔎",  color: "#8b5cf6", to: "/tools/upscale" },
      { nameKey: "tools.whisper.name",         descKey: "tools.whisper.desc",         icon: "🎤",  color: "#06b6d4", to: "/tools/whisper" },
    ],
  },
  {
    id: "media",
    titleKey: "home.cat.media",
    descKey: "home.cat.media_desc",
    accent: "#f97316",
    tools: [
      { nameKey: "tools.imageCompress.name", descKey: "tools.imageCompress.desc", icon: "IMG", color: "#f59e0b", to: "/tools/image-compress" },
      { nameKey: "tools.videoCompress.name", descKey: "tools.videoCompress.desc", icon: "🎬",  color: "#ef4444", to: "/tools/video-compress" },
      { nameKey: "tools.videoToGif.name",    descKey: "tools.videoToGif.desc",    icon: "🎞",  color: "#db2777", to: "/tools/video-to-gif" },
      { nameKey: "tools.palette.name",       descKey: "tools.palette.desc",       icon: "🎨",  color: "#7c3aed", to: "/tools/palette" },
      { nameKey: "tools.exif.name",          descKey: "tools.exif.desc",          icon: "🔍",  color: "#f97316", to: "/tools/exif" },
    ],
  },
  {
    id: "dev",
    titleKey: "home.cat.dev",
    descKey: "home.cat.dev_desc",
    accent: "#10b981",
    tools: [
      { nameKey: "tools.base64.name",      descKey: "tools.base64.desc",      icon: "B64", color: "#0a84ff", to: "/tools/base64" },
      { nameKey: "tools.qrcode.name",      descKey: "tools.qrcode.desc",      icon: "▣",   color: "#0f172a", to: "/tools/qrcode" },
      { nameKey: "tools.fileEncrypt.name", descKey: "tools.fileEncrypt.desc", icon: "🔒",  color: "#059669", to: "/tools/file-encrypt" },
      { nameKey: "tools.pdf.name",         descKey: "tools.pdf.desc",         icon: "📑",  color: "#dc2626", to: "/tools/pdf" },
    ],
  },
];

const UPCOMING_TOOLS = [
  { nameKey: "upcoming.regexTester",   icon: "/./", color: "#8b5cf6" },
  { nameKey: "upcoming.jwtDecoder",    icon: "JWT", color: "#f59e0b" },
  { nameKey: "upcoming.hashGenerator", icon: "#",   color: "#10b981" },
  { nameKey: "upcoming.urlParser",     icon: "://", color: "#ec4899" },
  { nameKey: "upcoming.diffChecker",   icon: "≠",   color: "#ef4444" },
];

const TOTAL_TOOLS = CATEGORIES.reduce((n, c) => n + c.tools.length, 0);

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t("home.title")}
        description={t("home.subtitle")}
        path="/"
        structuredData={schema.website({ url: "https://onetools.dev" })}
      />
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
        }}
      >
        {/* ── Hero ───────────────────────────────────────── */}
        <section
          style={{
            padding: "96px 0 60px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 5px 5px 14px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "#ffffff",
              fontSize: 12.5,
              color: "var(--text-secondary)",
              fontWeight: 500,
              marginBottom: 28,
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
            {t("home.heroBadge", { n: TOTAL_TOOLS })}
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                background: "var(--gradient-brand)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.1,
              }}
            >
              {t("home.heroBadgeNew")}
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 80px)",
              fontWeight: 700,
              letterSpacing: -2.8,
              lineHeight: 1.02,
              color: "var(--text-primary)",
            }}
          >
            {(() => {
              const title = t("home.title");
              const gradientStart = Math.max(0, title.length - 3);
              return title.split("").map((ch, i) =>
                i >= gradientStart ? (
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
                ) : (
                  <span key={i}>{ch}</span>
                )
              );
            })()}
          </h1>

          <p
            style={{
              fontSize: 17.5,
              color: "var(--text-secondary)",
              marginTop: 22,
              maxWidth: 580,
              margin: "22px auto 0",
              lineHeight: 1.55,
              fontWeight: 450,
              letterSpacing: -0.2,
            }}
          >
            {t("home.subtitle")}
          </p>

          {/* Stats strip — a single row of value props */}
          <div
            style={{
              display: "inline-flex",
              marginTop: 36,
              padding: "0",
              borderRadius: 999,
              background: "#ffffff",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              overflow: "hidden",
              flexWrap: "wrap",
            }}
          >
            {[
              { num: TOTAL_TOOLS, lbl: t("home.statTools") },
              { num: "0", lbl: t("home.statUploads"), accent: "var(--green)" },
              { num: "0", lbl: t("home.statSignup"), accent: "var(--brand)" },
              { num: "∞", lbl: t("home.statFree") },
            ].map((s, i, a) => (
              <div
                key={i}
                style={{
                  padding: "10px 22px",
                  borderRight:
                    i < a.length - 1 ? "1px solid var(--border-light)" : "none",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: s.accent || "var(--text-primary)",
                    letterSpacing: -0.5,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {s.num}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    letterSpacing: -0.1,
                  }}
                >
                  {s.lbl}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Category nav chips ────────────────────────── */}
        <nav
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            flexWrap: "wrap",
            padding: "0 0 36px",
            position: "sticky",
            top: 58,
            zIndex: 10,
            background:
              "linear-gradient(180deg, #fafbfc 70%, rgba(250,251,252,0.4))",
            marginLeft: -24,
            marginRight: -24,
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 8,
          }}
        >
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "#ffffff",
                color: "var(--text-secondary)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: -0.1,
                textDecoration: "none",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.accent;
                e.currentTarget.style.color = c.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: c.accent,
                }}
              />
              {t(c.titleKey)}
              <span
                style={{
                  fontSize: 10.5,
                  color: "var(--text-faint)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                {c.tools.length}
              </span>
            </a>
          ))}
        </nav>

        {/* ── Categories ────────────────────────────────── */}
        {CATEGORIES.map((cat) => (
          <section
            id={`cat-${cat.id}`}
            key={cat.id}
            style={{ paddingBottom: 48, scrollMarginTop: 110 }}
          >
            <CategoryHeading
              title={t(cat.titleKey)}
              desc={t(cat.descKey)}
              accent={cat.accent}
              count={cat.tools.length}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 12,
              }}
            >
              {cat.tools.map((tool, i) => (
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
        ))}

        {/* ── Upcoming ──────────────────────────────────── */}
        <section
          id="upcoming"
          style={{
            paddingBottom: 96,
            paddingTop: 36,
            borderTop: "1px solid var(--border-light)",
            scrollMarginTop: 110,
          }}
        >
          <CategoryHeading
            title={t("home.upcomingTools")}
            desc={t("home.upcomingDesc")}
            accent="var(--text-muted)"
            count={UPCOMING_TOOLS.length}
            muted
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
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
    </>
  );
}

function CategoryHeading({ title, desc, accent, count, muted }) {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: muted ? "transparent" : accent,
              border: muted ? `1.5px dashed ${accent}` : `none`,
            }}
          />
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: -0.6,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 999,
              background: muted ? "var(--bg-subtle)" : `${accent}14`,
              color: muted ? "var(--text-muted)" : accent,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
            }}
          >
            {count}
          </span>
        </div>
        {desc && (
          <p
            style={{
              fontSize: 13.5,
              color: "var(--text-muted)",
              marginTop: 6,
              marginLeft: 20,
              fontWeight: 400,
              letterSpacing: -0.1,
            }}
          >
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}
