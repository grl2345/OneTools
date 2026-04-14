import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ToolCard from "../components/ToolCard";
import SEO, { schema } from "../components/SEO";

// Tag vocabulary kept tight so the grid reads as a coherent matrix,
// not a zoo of labels. First tag is highlighted in accent color.
const CATEGORIES = [
  {
    id: "text",
    titleKey: "home.cat.text",
    accent: "#5b5bf5",
    tools: [
      { nameKey: "tools.jsonFormatter.name",   descKey: "tools.jsonFormatter.desc",   iconName: "json",       to: "/tools/json",        tags: ["AI", "格式化", "Schema"] },
      { nameKey: "tools.markdownPreview.name", descKey: "tools.markdownPreview.desc", iconName: "markdown",   to: "/tools/markdown",    tags: ["AI", "GFM", "实时"] },
      { nameKey: "tools.naming.name",          descKey: "tools.naming.desc",          iconName: "naming",     to: "/tools/naming",      tags: ["AI", "命名"] },
      { nameKey: "tools.cron.name",            descKey: "tools.cron.desc",            iconName: "cron",       to: "/tools/cron",        tags: ["AI", "Cron"] },
      { nameKey: "tools.timestamp.name",       descKey: "tools.timestamp.desc",       iconName: "timestamp",  to: "/tools/timestamp",   tags: ["本地", "自然语言"] },
      { nameKey: "tools.flowchart.name",       descKey: "tools.flowchart.desc",       iconName: "flowchart",  to: "/tools/flowchart",   tags: ["AI", "Mermaid"] },
    ],
  },
  {
    id: "doc",
    titleKey: "home.cat.doc",
    accent: "#ff6b35",
    tools: [
      { nameKey: "tools.pdfSummary.name",   descKey: "tools.pdfSummary.desc",   iconName: "pdfSummary",   to: "/tools/pdf-summary",   tags: ["AI", "PDF", "摘要"] },
      { nameKey: "tools.ocr.name",          descKey: "tools.ocr.desc",          iconName: "ocr",          to: "/tools/ocr",           tags: ["AI", "Vision", "代码"] },
      { nameKey: "tools.handwriting.name",  descKey: "tools.handwriting.desc",  iconName: "handwriting",  to: "/tools/handwriting",   tags: ["AI", "Vision", "中英文"] },
      { nameKey: "tools.imageToTable.name", descKey: "tools.imageToTable.desc", iconName: "imageToTable", to: "/tools/image-to-table",tags: ["AI", "Vision", "CSV"] },
    ],
  },
  {
    id: "image",
    titleKey: "home.cat.image",
    accent: "#8b5cf6",
    tools: [
      { nameKey: "tools.removeBg.name",        descKey: "tools.removeBg.desc",        iconName: "removeBg",        to: "/tools/remove-bg",        tags: ["WASM", "本地", "隐私"] },
      { nameKey: "tools.removeWatermark.name", descKey: "tools.removeWatermark.desc", iconName: "removeWatermark", to: "/tools/remove-watermark", tags: ["WASM", "LaMa", "本地"] },
      { nameKey: "tools.idPhoto.name",         descKey: "tools.idPhoto.desc",         iconName: "idPhoto",         to: "/tools/id-photo",         tags: ["WASM", "本地", "证件"] },
      { nameKey: "tools.upscale.name",         descKey: "tools.upscale.desc",         iconName: "upscale",         to: "/tools/upscale",          tags: ["WASM", "Swin2SR"] },
      { nameKey: "tools.imageCompress.name",   descKey: "tools.imageCompress.desc",   iconName: "imageCompress",   to: "/tools/image-compress",   tags: ["本地", "Canvas"] },
      { nameKey: "tools.palette.name",         descKey: "tools.palette.desc",         iconName: "palette",         to: "/tools/palette",          tags: ["本地", "k-means"] },
      { nameKey: "tools.exif.name",            descKey: "tools.exif.desc",            iconName: "exif",            to: "/tools/exif",             tags: ["本地", "隐私"] },
    ],
  },
  {
    id: "av",
    titleKey: "home.cat.av",
    accent: "#06b6d4",
    tools: [
      { nameKey: "tools.whisper.name",       descKey: "tools.whisper.desc",       iconName: "whisper",       to: "/tools/whisper",       tags: ["WASM", "Whisper", "隐私"] },
      { nameKey: "tools.videoCompress.name", descKey: "tools.videoCompress.desc", iconName: "videoCompress", to: "/tools/video-compress",tags: ["FFmpeg", "本地"] },
      { nameKey: "tools.videoToGif.name",    descKey: "tools.videoToGif.desc",    iconName: "videoToGif",    to: "/tools/video-to-gif",  tags: ["FFmpeg", "GIF"] },
    ],
  },
  {
    id: "util",
    titleKey: "home.cat.util",
    accent: "#059669",
    tools: [
      { nameKey: "tools.base64.name",      descKey: "tools.base64.desc",      iconName: "base64",      to: "/tools/base64",      tags: ["本地", "编解码"] },
      { nameKey: "tools.qrcode.name",      descKey: "tools.qrcode.desc",      iconName: "qrcode",      to: "/tools/qrcode",      tags: ["本地", "生成", "扫描"] },
      { nameKey: "tools.fileEncrypt.name", descKey: "tools.fileEncrypt.desc", iconName: "fileEncrypt", to: "/tools/file-encrypt",tags: ["WebCrypto", "AES-256", "隐私"] },
      { nameKey: "tools.pdf.name",         descKey: "tools.pdf.desc",         iconName: "pdf",         to: "/tools/pdf",         tags: ["本地", "合并", "拆分"] },
    ],
  },
];

const TOTAL_TOOLS = CATEGORIES.reduce((n, c) => n + c.tools.length, 0);

export default function Home() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  // Filtered categories: hide a category entirely if no tool matches
  const filteredCategories = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return CATEGORIES;
    return CATEGORIES
      .map((c) => ({
        ...c,
        tools: c.tools.filter((tool) => {
          const name = t(tool.nameKey).toLowerCase();
          const desc = t(tool.descKey).toLowerCase();
          const tags = (tool.tags || []).join(" ").toLowerCase();
          return (
            name.includes(query) || desc.includes(query) || tags.includes(query)
          );
        }),
      }))
      .filter((c) => c.tools.length > 0);
  }, [q, t]);

  const totalAfterFilter = filteredCategories.reduce((n, c) => n + c.tools.length, 0);

  return (
    <>
      <SEO
        title={t("home.title")}
        description={t("home.subtitle")}
        path="/"
        structuredData={schema.website({ url: "https://onetools.dev" })}
      />

      {/* Page header */}
      <header
        style={{
          padding: "32px 48px 24px",
          borderBottom: "1px solid var(--border-light)",
          background: "#ffffff",
          position: "sticky",
          top: 0,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: -0.6,
              color: "var(--text-primary)",
              marginBottom: 2,
            }}
          >
            {t("home.pageTitle")}
          </h1>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {q
              ? t("home.pageSubMatch", { n: totalAfterFilter, total: TOTAL_TOOLS })
              : t("home.pageSub", { n: TOTAL_TOOLS })}
          </div>
        </div>
        <div
          style={{
            position: "relative",
            width: 320,
            maxWidth: "100%",
          }}
        >
          <SearchIcon />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            style={{
              width: "100%",
              padding: "9px 14px 9px 38px",
              borderRadius: 9,
              border: "1px solid var(--border-strong)",
              background: "#ffffff",
              fontSize: 13.5,
              color: "var(--text-primary)",
              outline: "none",
              letterSpacing: -0.1,
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
          />
        </div>
      </header>

      {/* Content area */}
      <div
        style={{
          padding: "32px 48px 80px",
        }}
      >
        {filteredCategories.length === 0 ? (
          <div
            style={{
              padding: "80px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            {t("home.noResults")}
          </div>
        ) : (
          filteredCategories.map((cat, idx) => (
            <section
              id={`cat-${cat.id}`}
              key={cat.id}
              style={{
                paddingTop: idx === 0 ? 0 : 36,
                paddingBottom: 4,
                scrollMarginTop: 96,
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: -0.2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: cat.accent,
                      flexShrink: 0,
                    }}
                  />
                  {t(cat.titleKey)}
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontWeight: 400,
                      fontFamily: "var(--font-mono)",
                      marginLeft: 2,
                    }}
                  >
                    {cat.tools.length}
                  </span>
                </h2>
              </div>
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
                    iconName={tool.iconName}
                    accent={cat.accent}
                    tags={tool.tags}
                    to={tool.to}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {!q && <Upcoming />}
      </div>
    </>
  );
}

function Upcoming() {
  const { t } = useTranslation();
  const items = [
    t("upcoming.regexTester"),
    t("upcoming.jwtDecoder"),
    t("upcoming.hashGenerator"),
    t("upcoming.urlParser"),
    t("upcoming.diffChecker"),
  ];
  return (
    <section style={{ paddingTop: 48 }}>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: -0.2,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            border: "1.5px dashed var(--text-muted)",
            flexShrink: 0,
          }}
        />
        {t("home.upcomingTools")}
        <span
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            fontWeight: 400,
            fontFamily: "var(--font-mono)",
          }}
        >
          {items.length}
        </span>
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((label, i) => (
          <span
            key={i}
            style={{
              padding: "6px 11px",
              borderRadius: 8,
              border: "1px dashed var(--border-strong)",
              fontSize: 12.5,
              color: "var(--text-muted)",
              background: "transparent",
              letterSpacing: -0.1,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth="1.6"
      strokeLinecap="round"
      style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
    >
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3" />
    </svg>
  );
}
