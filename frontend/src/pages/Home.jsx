import { useTranslation } from "react-i18next";
import ToolCard from "../components/ToolCard";
import SEO, { schema } from "../components/SEO";

const CATEGORIES = [
  {
    id: "text",
    titleKey: "home.cat.text",
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
    id: "doc",
    titleKey: "home.cat.doc",
    tools: [
      { nameKey: "tools.pdfSummary.name",   descKey: "tools.pdfSummary.desc",   icon: "PDF", color: "#ef4444", to: "/tools/pdf-summary" },
      { nameKey: "tools.ocr.name",          descKey: "tools.ocr.desc",          icon: "🔤",  color: "#6366f1", to: "/tools/ocr" },
      { nameKey: "tools.handwriting.name",  descKey: "tools.handwriting.desc",  icon: "✍",   color: "#d946ef", to: "/tools/handwriting" },
      { nameKey: "tools.imageToTable.name", descKey: "tools.imageToTable.desc", icon: "▦",   color: "#10b981", to: "/tools/image-to-table" },
    ],
  },
  {
    id: "image",
    titleKey: "home.cat.image",
    tools: [
      { nameKey: "tools.removeBg.name",        descKey: "tools.removeBg.desc",        icon: "✂︎",  color: "#8b5cf6", to: "/tools/remove-bg" },
      { nameKey: "tools.removeWatermark.name", descKey: "tools.removeWatermark.desc", icon: "WM",  color: "#2563eb", to: "/tools/remove-watermark" },
      { nameKey: "tools.idPhoto.name",         descKey: "tools.idPhoto.desc",         icon: "📸",  color: "#f59e0b", to: "/tools/id-photo" },
      { nameKey: "tools.upscale.name",         descKey: "tools.upscale.desc",         icon: "🔎",  color: "#8b5cf6", to: "/tools/upscale" },
      { nameKey: "tools.imageCompress.name",   descKey: "tools.imageCompress.desc",   icon: "IMG", color: "#f59e0b", to: "/tools/image-compress" },
      { nameKey: "tools.palette.name",         descKey: "tools.palette.desc",         icon: "🎨",  color: "#7c3aed", to: "/tools/palette" },
      { nameKey: "tools.exif.name",            descKey: "tools.exif.desc",            icon: "🔍",  color: "#f97316", to: "/tools/exif" },
    ],
  },
  {
    id: "av",
    titleKey: "home.cat.av",
    tools: [
      { nameKey: "tools.whisper.name",       descKey: "tools.whisper.desc",       icon: "🎤",  color: "#06b6d4", to: "/tools/whisper" },
      { nameKey: "tools.videoCompress.name", descKey: "tools.videoCompress.desc", icon: "🎬",  color: "#ef4444", to: "/tools/video-compress" },
      { nameKey: "tools.videoToGif.name",    descKey: "tools.videoToGif.desc",    icon: "🎞",  color: "#db2777", to: "/tools/video-to-gif" },
    ],
  },
  {
    id: "util",
    titleKey: "home.cat.util",
    tools: [
      { nameKey: "tools.base64.name",      descKey: "tools.base64.desc",      icon: "B64", color: "#0a84ff", to: "/tools/base64" },
      { nameKey: "tools.qrcode.name",      descKey: "tools.qrcode.desc",      icon: "▣",   color: "#0f172a", to: "/tools/qrcode" },
      { nameKey: "tools.fileEncrypt.name", descKey: "tools.fileEncrypt.desc", icon: "🔒",  color: "#059669", to: "/tools/file-encrypt" },
      { nameKey: "tools.pdf.name",         descKey: "tools.pdf.desc",         icon: "📑",  color: "#dc2626", to: "/tools/pdf" },
    ],
  },
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
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* ── Hero — quiet typography ─────────────── */}
        <section
          style={{
            padding: "120px 0 80px",
          }}
        >
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-muted)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            {t("home.eyebrow", { n: TOTAL_TOOLS })}
          </div>

          <h1
            style={{
              fontSize: "clamp(44px, 7vw, 68px)",
              fontWeight: 700,
              letterSpacing: -2.2,
              lineHeight: 1.05,
              color: "var(--text-primary)",
              maxWidth: 820,
            }}
          >
            {t("home.title")}
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "var(--text-secondary)",
              marginTop: 20,
              maxWidth: 620,
              lineHeight: 1.55,
              fontWeight: 400,
              letterSpacing: -0.2,
            }}
          >
            {t("home.subtitle")}
          </p>
        </section>

        {/* ── Categories ─────────────────────────── */}
        {CATEGORIES.map((cat, idx) => (
          <section
            id={`cat-${cat.id}`}
            key={cat.id}
            style={{
              paddingTop: idx === 0 ? 0 : 56,
              paddingBottom: 8,
            }}
          >
            <CategoryHeader title={t(cat.titleKey)} count={cat.tools.length} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 10,
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

        {/* ── Upcoming ───────────────────────────── */}
        <Upcoming />
      </div>
    </>
  );
}

function CategoryHeader({ title, count }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        marginBottom: 18,
        paddingBottom: 8,
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: -0.2,
        }}
      >
        {title}
      </h2>
      <span
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontWeight: 400,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function Upcoming() {
  const { t } = useTranslation();
  const items = [
    { nameKey: "upcoming.regexTester",   icon: "/./" },
    { nameKey: "upcoming.jwtDecoder",    icon: "JWT" },
    { nameKey: "upcoming.hashGenerator", icon: "#"   },
    { nameKey: "upcoming.urlParser",     icon: "://" },
    { nameKey: "upcoming.diffChecker",   icon: "≠"   },
  ];
  return (
    <section
      style={{
        paddingTop: 72,
        paddingBottom: 96,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 14,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: -0.2,
          }}
        >
          {t("home.upcomingTools")}
        </h2>
        <span
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {items.length}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              borderRadius: 999,
              border: "1px dashed var(--border-strong)",
              fontSize: 13,
              color: "var(--text-muted)",
              background: "transparent",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-faint)",
              }}
            >
              {item.icon}
            </span>
            {t(item.nameKey)}
          </span>
        ))}
      </div>
    </section>
  );
}
