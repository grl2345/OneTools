import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ToolCard from "../components/ToolCard";
import ToolIcon from "../components/ToolIcon";
import SEO, { schema } from "../components/SEO";

// Five "painkiller" tools highlighted in the hero — things people actually
// pay money for elsewhere. Ordered by how clearly they replace a paid service.
const PAINKILLERS = [
  {
    nameKey: "tools.idPhoto.name",
    benefitKey: "home.paink.idPhoto",
    priceAnchorKey: "home.paink.idPhoto_price",
    iconName: "idPhoto",
    accent: "#8b5cf6",
    to: "/tools/id-photo",
  },
  {
    nameKey: "tools.removeWatermark.name",
    benefitKey: "home.paink.removeWatermark",
    priceAnchorKey: "home.paink.removeWatermark_price",
    iconName: "removeWatermark",
    accent: "#8b5cf6",
    to: "/tools/remove-watermark",
  },
  {
    nameKey: "tools.pdfSummary.name",
    benefitKey: "home.paink.pdfSummary",
    priceAnchorKey: "home.paink.pdfSummary_price",
    iconName: "pdfSummary",
    accent: "#ff6b35",
    to: "/tools/pdf-summary",
  },
  {
    nameKey: "tools.videoCompress.name",
    benefitKey: "home.paink.videoCompress",
    priceAnchorKey: "home.paink.videoCompress_price",
    iconName: "videoCompress",
    accent: "#06b6d4",
    to: "/tools/video-compress",
  },
  {
    nameKey: "tools.fileEncrypt.name",
    benefitKey: "home.paink.fileEncrypt",
    priceAnchorKey: "home.paink.fileEncrypt_price",
    iconName: "fileEncrypt",
    accent: "#059669",
    to: "/tools/file-encrypt",
  },
];

// Scenario-based categories (what situation the user is in) rather than
// technology-based buckets. Benefit-driven short desc per tool via descKey
// pointing at home.bene.* strings.
const CATEGORIES = [
  {
    id: "privacy",
    titleKey: "home.scene.privacy",
    subKey: "home.scene.privacy_sub",
    accent: "#059669",
    tools: [
      { nameKey: "tools.fileEncrypt.name", descKey: "home.bene.fileEncrypt",      iconName: "fileEncrypt",     to: "/tools/file-encrypt",     tags: ["AES-256", "本地", "隐私"] },
      { nameKey: "tools.exif.name",        descKey: "home.bene.exif",             iconName: "exif",            to: "/tools/exif",             tags: ["本地", "隐私"] },
      { nameKey: "tools.removeWatermark.name", descKey: "home.bene.removeWatermark", iconName: "removeWatermark", to: "/tools/remove-watermark", tags: ["WASM", "LaMa", "本地"] },
    ],
  },
  {
    id: "doc",
    titleKey: "home.scene.doc",
    subKey: "home.scene.doc_sub",
    accent: "#ff6b35",
    tools: [
      { nameKey: "tools.pdf.name",         descKey: "home.bene.pdf",          iconName: "pdf",         to: "/tools/pdf",          tags: ["本地", "合并", "拆分"] },
      { nameKey: "tools.pdfSummary.name",  descKey: "home.bene.pdfSummary",   iconName: "pdfSummary",  to: "/tools/pdf-summary",  tags: ["AI", "摘要", "要点"] },
      { nameKey: "tools.ocr.name",         descKey: "home.bene.ocr",          iconName: "ocr",         to: "/tools/ocr",          tags: ["AI", "代码截图"] },
      { nameKey: "tools.handwriting.name", descKey: "home.bene.handwriting",  iconName: "handwriting", to: "/tools/handwriting",  tags: ["AI", "中英文"] },
      { nameKey: "tools.imageToTable.name",descKey: "home.bene.imageToTable", iconName: "imageToTable",to: "/tools/image-to-table",tags: ["AI", "CSV"] },
    ],
  },
  {
    id: "social",
    titleKey: "home.scene.social",
    subKey: "home.scene.social_sub",
    accent: "#8b5cf6",
    tools: [
      { nameKey: "tools.idPhoto.name",       descKey: "home.bene.idPhoto",       iconName: "idPhoto",       to: "/tools/id-photo",       tags: ["WASM", "证件"] },
      { nameKey: "tools.removeBg.name",      descKey: "home.bene.removeBg",      iconName: "removeBg",      to: "/tools/remove-bg",      tags: ["WASM", "本地"] },
      { nameKey: "tools.imageCompress.name", descKey: "home.bene.imageCompress", iconName: "imageCompress", to: "/tools/image-compress", tags: ["本地"] },
      { nameKey: "tools.upscale.name",       descKey: "home.bene.upscale",       iconName: "upscale",       to: "/tools/upscale",        tags: ["WASM", "Swin2SR"] },
      { nameKey: "tools.palette.name",       descKey: "home.bene.palette",       iconName: "palette",       to: "/tools/palette",        tags: ["本地"] },
    ],
  },
  {
    id: "av",
    titleKey: "home.scene.av",
    subKey: "home.scene.av_sub",
    accent: "#06b6d4",
    tools: [
      { nameKey: "tools.videoCompress.name", descKey: "home.bene.videoCompress", iconName: "videoCompress", to: "/tools/video-compress", tags: ["FFmpeg", "微信"] },
      { nameKey: "tools.videoToGif.name",    descKey: "home.bene.videoToGif",    iconName: "videoToGif",    to: "/tools/video-to-gif",   tags: ["FFmpeg", "GIF"] },
      { nameKey: "tools.whisper.name",       descKey: "home.bene.whisper",       iconName: "whisper",       to: "/tools/whisper",        tags: ["WASM", "Whisper"] },
    ],
  },
  {
    id: "dev",
    titleKey: "home.scene.dev",
    subKey: "home.scene.dev_sub",
    accent: "#5b5bf5",
    tools: [
      { nameKey: "tools.jsonFormatter.name",   descKey: "home.bene.jsonFormatter",   iconName: "json",       to: "/tools/json",      tags: ["AI", "Schema"] },
      { nameKey: "tools.markdownPreview.name", descKey: "home.bene.markdownPreview", iconName: "markdown",   to: "/tools/markdown",  tags: ["AI", "GFM"] },
      { nameKey: "tools.naming.name",          descKey: "home.bene.naming",          iconName: "naming",     to: "/tools/naming",    tags: ["AI"] },
      { nameKey: "tools.cron.name",            descKey: "home.bene.cron",            iconName: "cron",       to: "/tools/cron",      tags: ["AI"] },
      { nameKey: "tools.timestamp.name",       descKey: "home.bene.timestamp",       iconName: "timestamp",  to: "/tools/timestamp", tags: ["本地", "chrono"] },
      { nameKey: "tools.flowchart.name",       descKey: "home.bene.flowchart",       iconName: "flowchart",  to: "/tools/flowchart", tags: ["AI", "Mermaid"] },
      { nameKey: "tools.base64.name",          descKey: "home.bene.base64",          iconName: "base64",     to: "/tools/base64",    tags: ["本地"] },
      { nameKey: "tools.qrcode.name",          descKey: "home.bene.qrcode",          iconName: "qrcode",     to: "/tools/qrcode",    tags: ["本地"] },
    ],
  },
];

const TOTAL_TOOLS = CATEGORIES.reduce((n, c) => n + c.tools.length, 0);

export default function Home() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return CATEGORIES;
    return CATEGORIES.map((c) => ({
      ...c,
      tools: c.tools.filter((tool) => {
        const n = t(tool.nameKey).toLowerCase();
        const d = t(tool.descKey).toLowerCase();
        const tg = (tool.tags || []).join(" ").toLowerCase();
        return n.includes(query) || d.includes(query) || tg.includes(query);
      }),
    })).filter((c) => c.tools.length > 0);
  }, [q, t]);

  const totalAfterFilter = filtered.reduce((n, c) => n + c.tools.length, 0);

  return (
    <>
      <SEO
        title={t("home.title")}
        description={t("home.subtitle")}
        path="/"
        structuredData={schema.website({ url: "https://onetools.dev" })}
      />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 28px" }}>
        {/* ── Hero: painkiller-centric ───────────────── */}
        <section style={{ padding: "72px 0 32px" }}>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-muted)",
              fontWeight: 500,
              letterSpacing: -0.05,
              marginBottom: 16,
            }}
          >
            {t("home.eyebrow", { n: TOTAL_TOOLS })}
          </div>
          <h1
            style={{
              fontSize: "clamp(34px, 5vw, 50px)",
              fontWeight: 600,
              letterSpacing: -1.6,
              lineHeight: 1.1,
              color: "var(--text-primary)",
              maxWidth: 760,
            }}
          >
            {t("home.heroTitle")}
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "var(--text-secondary)",
              marginTop: 16,
              maxWidth: 660,
              lineHeight: 1.55,
              fontWeight: 400,
              letterSpacing: -0.15,
            }}
          >
            {t("home.heroSub")}
          </p>

          {/* 5 Painkiller showcase row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 10,
              marginTop: 32,
            }}
          >
            {PAINKILLERS.map((p, i) => (
              <Link
                key={i}
                to={p.to}
                style={{
                  textDecoration: "none",
                  padding: "16px 16px",
                  borderRadius: 12,
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${p.accent}55`;
                  e.currentTarget.style.boxShadow = `0 0 0 1px ${p.accent}18, 0 4px 16px -4px ${p.accent}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: `${p.accent}14`,
                    color: p.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ToolIcon name={p.iconName} size={18} />
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: -0.2,
                  }}
                >
                  {t(p.nameKey)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {t(p.benefitKey)}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: p.accent,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  {t(p.priceAnchorKey)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Search */}
        <section style={{ padding: "16px 0 28px" }}>
          <div style={{ position: "relative", maxWidth: 520 }}>
            <SearchIcon />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              style={{
                width: "100%",
                padding: "11px 16px 11px 40px",
                borderRadius: 10,
                border: "1px solid var(--border-strong)",
                background: "#ffffff",
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
                letterSpacing: -0.1,
                boxShadow: "var(--shadow-sm)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
            />
          </div>
          {q && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              {t("home.pageSubMatch", { n: totalAfterFilter, total: TOTAL_TOOLS })}
            </div>
          )}
        </section>

        {/* Scenario categories */}
        {filtered.length === 0 ? (
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
          filtered.map((cat, idx) => (
            <section
              id={`cat-${cat.id}`}
              key={cat.id}
              style={{ paddingTop: idx === 0 ? 8 : 48, paddingBottom: 4, scrollMarginTop: 80 }}
            >
              <div style={{ marginBottom: 14 }}>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: -0.4,
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
                    }}
                  >
                    {cat.tools.length}
                  </span>
                </h2>
                {cat.subKey && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      marginTop: 4,
                      marginLeft: 18,
                      fontWeight: 400,
                      letterSpacing: -0.05,
                    }}
                  >
                    {t(cat.subKey)}
                  </p>
                )}
              </div>
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

        {!q && (
          <>
            <ComparisonTable />
            <Upcoming />
          </>
        )}
      </div>
    </>
  );
}

function ComparisonTable() {
  const { t } = useTranslation();
  const rows = [
    { keyBase: "cmp.r_price",    ot: "cmp.ot.price",    others: ["cmp.removebg.price",  "cmp.photoshop.price", "cmp.chatgpt.price",    "cmp.studio.price"] },
    { keyBase: "cmp.r_signup",   ot: "cmp.ot.signup",   others: ["cmp.removebg.signup", "cmp.photoshop.signup","cmp.chatgpt.signup",   "cmp.studio.signup"] },
    { keyBase: "cmp.r_upload",   ot: "cmp.ot.upload",   others: ["cmp.removebg.upload", "cmp.photoshop.upload","cmp.chatgpt.upload",   "cmp.studio.upload"] },
    { keyBase: "cmp.r_offline",  ot: "cmp.ot.offline",  others: ["cmp.removebg.offline","cmp.photoshop.offline","cmp.chatgpt.offline",  "cmp.studio.offline"] },
    { keyBase: "cmp.r_batch",    ot: "cmp.ot.batch",    others: ["cmp.removebg.batch",  "cmp.photoshop.batch", "cmp.chatgpt.batch",    "cmp.studio.batch"] },
  ];
  const competitors = ["Remove.bg", "Photoshop", "ChatGPT Plus", t("cmp.studio")];

  const cell = {
    padding: "12px 14px",
    borderBottom: "1px solid var(--border-light)",
    fontSize: 13,
    color: "var(--text-secondary)",
    letterSpacing: -0.05,
  };

  return (
    <section style={{ paddingTop: 64, paddingBottom: 8 }}>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.6,
          }}
        >
          {t("cmp.title")}
        </h2>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginTop: 6,
            lineHeight: 1.55,
            fontWeight: 400,
          }}
        >
          {t("cmp.sub")}
        </p>
      </div>
      <div
        style={{
          borderRadius: 14,
          border: "1px solid var(--border)",
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "#fafbfc" }}>
                <th style={{ ...cell, textAlign: "left", fontWeight: 600, color: "var(--text-primary)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  &nbsp;
                </th>
                <th
                  style={{
                    ...cell,
                    textAlign: "left",
                    fontWeight: 700,
                    color: "var(--brand)",
                    fontSize: 13.5,
                    letterSpacing: -0.2,
                    background: "rgba(91,91,245,0.05)",
                  }}
                >
                  OneTools
                </th>
                {competitors.map((c, i) => (
                  <th
                    key={i}
                    style={{
                      ...cell,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      fontSize: 12.5,
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  <td
                    style={{
                      ...cell,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontSize: 12.5,
                      background: "#fafbfc",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t(r.keyBase)}
                  </td>
                  <td
                    style={{
                      ...cell,
                      color: "var(--brand)",
                      fontWeight: 600,
                      background: "rgba(91,91,245,0.03)",
                    }}
                  >
                    {t(r.ot)}
                  </td>
                  {r.others.map((k, ci) => (
                    <td key={ci} style={cell}>
                      {t(k)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
    <section style={{ paddingTop: 48, paddingBottom: 96 }}>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: -0.3,
          marginBottom: 12,
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
            border: "1.5px dashed var(--text-muted)",
            flexShrink: 0,
          }}
        />
        {t("home.upcomingTools")}
        <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 400, fontFamily: "var(--font-mono)" }}>
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
      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
    >
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3" />
    </svg>
  );
}
