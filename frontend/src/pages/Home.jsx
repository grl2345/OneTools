import { useTranslation } from "react-i18next";
import ToolCard from "../components/ToolCard";
import SEO, { schema } from "../components/SEO";

const CATEGORIES = [
  {
    id: "text",
    titleKey: "home.cat.text",
    accent: "#5b5bf5", // indigo — for text / data
    tools: [
      { nameKey: "tools.jsonFormatter.name",   descKey: "tools.jsonFormatter.desc",   iconName: "json",       to: "/tools/json" },
      { nameKey: "tools.markdownPreview.name", descKey: "tools.markdownPreview.desc", iconName: "markdown",   to: "/tools/markdown" },
      { nameKey: "tools.naming.name",          descKey: "tools.naming.desc",          iconName: "naming",     to: "/tools/naming" },
      { nameKey: "tools.cron.name",            descKey: "tools.cron.desc",            iconName: "cron",       to: "/tools/cron" },
      { nameKey: "tools.timestamp.name",       descKey: "tools.timestamp.desc",       iconName: "timestamp",  to: "/tools/timestamp" },
      { nameKey: "tools.flowchart.name",       descKey: "tools.flowchart.desc",       iconName: "flowchart",  to: "/tools/flowchart" },
    ],
  },
  {
    id: "doc",
    titleKey: "home.cat.doc",
    accent: "#ff6b35", // warm orange — for documents
    tools: [
      { nameKey: "tools.pdfSummary.name",   descKey: "tools.pdfSummary.desc",   iconName: "pdfSummary",   to: "/tools/pdf-summary" },
      { nameKey: "tools.ocr.name",          descKey: "tools.ocr.desc",          iconName: "ocr",          to: "/tools/ocr" },
      { nameKey: "tools.handwriting.name",  descKey: "tools.handwriting.desc",  iconName: "handwriting",  to: "/tools/handwriting" },
      { nameKey: "tools.imageToTable.name", descKey: "tools.imageToTable.desc", iconName: "imageToTable", to: "/tools/image-to-table" },
    ],
  },
  {
    id: "image",
    titleKey: "home.cat.image",
    accent: "#8b5cf6", // purple — for images
    tools: [
      { nameKey: "tools.removeBg.name",        descKey: "tools.removeBg.desc",        iconName: "removeBg",        to: "/tools/remove-bg" },
      { nameKey: "tools.removeWatermark.name", descKey: "tools.removeWatermark.desc", iconName: "removeWatermark", to: "/tools/remove-watermark" },
      { nameKey: "tools.idPhoto.name",         descKey: "tools.idPhoto.desc",         iconName: "idPhoto",         to: "/tools/id-photo" },
      { nameKey: "tools.upscale.name",         descKey: "tools.upscale.desc",         iconName: "upscale",         to: "/tools/upscale" },
      { nameKey: "tools.imageCompress.name",   descKey: "tools.imageCompress.desc",   iconName: "imageCompress",   to: "/tools/image-compress" },
      { nameKey: "tools.palette.name",         descKey: "tools.palette.desc",         iconName: "palette",         to: "/tools/palette" },
      { nameKey: "tools.exif.name",            descKey: "tools.exif.desc",            iconName: "exif",            to: "/tools/exif" },
    ],
  },
  {
    id: "av",
    titleKey: "home.cat.av",
    accent: "#06b6d4", // teal — for audio/video
    tools: [
      { nameKey: "tools.whisper.name",       descKey: "tools.whisper.desc",       iconName: "whisper",       to: "/tools/whisper" },
      { nameKey: "tools.videoCompress.name", descKey: "tools.videoCompress.desc", iconName: "videoCompress", to: "/tools/video-compress" },
      { nameKey: "tools.videoToGif.name",    descKey: "tools.videoToGif.desc",    iconName: "videoToGif",    to: "/tools/video-to-gif" },
    ],
  },
  {
    id: "util",
    titleKey: "home.cat.util",
    accent: "#059669", // green — for utilities
    tools: [
      { nameKey: "tools.base64.name",      descKey: "tools.base64.desc",      iconName: "base64",      to: "/tools/base64" },
      { nameKey: "tools.qrcode.name",      descKey: "tools.qrcode.desc",      iconName: "qrcode",      to: "/tools/qrcode" },
      { nameKey: "tools.fileEncrypt.name", descKey: "tools.fileEncrypt.desc", iconName: "fileEncrypt", to: "/tools/file-encrypt" },
      { nameKey: "tools.pdf.name",         descKey: "tools.pdf.desc",         iconName: "pdf",         to: "/tools/pdf" },
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
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        {/* ── Hero — Apple marketing page typography ──── */}
        <section
          style={{
            padding: "140px 0 80px",
            maxWidth: 820,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              letterSpacing: -0.05,
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            {t("home.eyebrow", { n: TOTAL_TOOLS })}
          </div>

          <h1
            style={{
              fontSize: "clamp(44px, 6.6vw, 64px)",
              fontWeight: 600,
              letterSpacing: -2.4,
              lineHeight: 1.06,
              color: "var(--text-primary)",
            }}
          >
            {t("home.title")}
          </h1>

          <p
            style={{
              fontSize: 19,
              color: "var(--text-secondary)",
              marginTop: 22,
              maxWidth: 640,
              lineHeight: 1.5,
              fontWeight: 400,
              letterSpacing: -0.25,
            }}
          >
            {t("home.subtitle")}
          </p>
        </section>

        {/* ── Categories ──────────────────────────────── */}
        {CATEGORIES.map((cat, idx) => (
          <section
            id={`cat-${cat.id}`}
            key={cat.id}
            style={{
              paddingTop: idx === 0 ? 0 : 64,
              paddingBottom: 0,
            }}
          >
            <CategoryHeader
              title={t(cat.titleKey)}
              count={cat.tools.length}
              accent={cat.accent}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 10,
              }}
            >
              {cat.tools.map((tool, i) => (
                <ToolCard
                  key={i}
                  name={t(tool.nameKey)}
                  desc={t(tool.descKey)}
                  iconName={tool.iconName}
                  accent={cat.accent}
                  to={tool.to}
                />
              ))}
            </div>
          </section>
        ))}

        <Upcoming />
      </div>
    </>
  );
}

function CategoryHeader({ title, count, accent }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: -0.5,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: accent,
            flexShrink: 0,
          }}
        />
        {title}
        <span
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            fontWeight: 400,
            fontFamily: "var(--font-mono)",
          }}
        >
          {count}
        </span>
      </h2>
    </div>
  );
}

function Upcoming() {
  const { t } = useTranslation();
  const items = [
    { nameKey: "upcoming.regexTester"   },
    { nameKey: "upcoming.jwtDecoder"    },
    { nameKey: "upcoming.hashGenerator" },
    { nameKey: "upcoming.urlParser"     },
    { nameKey: "upcoming.diffChecker"   },
  ];
  return (
    <section style={{ paddingTop: 88, paddingBottom: 120 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: -0.5,
          marginBottom: 16,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        {t("home.upcomingTools")}
        <span
          style={{
            fontSize: 13,
            color: "var(--text-faint)",
            fontWeight: 400,
            fontFamily: "var(--font-mono)",
          }}
        >
          {items.length}
        </span>
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              padding: "7px 13px",
              borderRadius: 999,
              border: "1px dashed var(--border-strong)",
              fontSize: 13,
              color: "var(--text-muted)",
              background: "transparent",
              letterSpacing: -0.1,
            }}
          >
            {t(item.nameKey)}
          </span>
        ))}
      </div>
    </section>
  );
}
