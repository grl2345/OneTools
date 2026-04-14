import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ToolCard from "../components/ToolCard";
import ToolIcon from "../components/ToolIcon";
import SEO, { schema } from "../components/SEO";

const PAINKILLERS = [
  { nameKey: "tools.idPhoto.name",          taglineKey: "home.paink.idPhoto",         iconName: "idPhoto",         accent: "#7c3aed", to: "/tools/id-photo" },
  { nameKey: "tools.removeWatermark.name",  taglineKey: "home.paink.removeWatermark", iconName: "removeWatermark", accent: "#db2777", to: "/tools/remove-watermark" },
  { nameKey: "tools.pdfSummary.name",       taglineKey: "home.paink.pdfSummary",      iconName: "pdfSummary",      accent: "#ea580c", to: "/tools/pdf-summary" },
  { nameKey: "tools.videoCompress.name",    taglineKey: "home.paink.videoCompress",   iconName: "videoCompress",   accent: "#0891b2", to: "/tools/video-compress" },
  { nameKey: "tools.fileEncrypt.name",      taglineKey: "home.paink.fileEncrypt",     iconName: "fileEncrypt",     accent: "#059669", to: "/tools/file-encrypt" },
];

const CATEGORIES = [
  {
    id: "privacy", titleKey: "home.scene.privacy", subKey: "home.scene.privacy_sub", accent: "#059669",
    tools: [
      { nameKey: "tools.fileEncrypt.name",     descKey: "home.bene.fileEncrypt",     iconName: "fileEncrypt",     to: "/tools/file-encrypt",     tags: ["加密", "离线"] },
      { nameKey: "tools.exif.name",            descKey: "home.bene.exif",            iconName: "exif",            to: "/tools/exif",             tags: ["元数据"] },
      { nameKey: "tools.removeWatermark.name", descKey: "home.bene.removeWatermark", iconName: "removeWatermark", to: "/tools/remove-watermark", tags: ["画笔", "修复"] },
    ],
  },
  {
    id: "doc", titleKey: "home.scene.doc", subKey: "home.scene.doc_sub", accent: "#ea580c",
    tools: [
      { nameKey: "tools.pdf.name",          descKey: "home.bene.pdf",          iconName: "pdf",          to: "/tools/pdf",            tags: ["合并", "拆分"] },
      { nameKey: "tools.pdfSummary.name",   descKey: "home.bene.pdfSummary",   iconName: "pdfSummary",   to: "/tools/pdf-summary",    tags: ["摘要", "要点"] },
      { nameKey: "tools.ocr.name",          descKey: "home.bene.ocr",          iconName: "ocr",          to: "/tools/ocr",            tags: ["识字", "代码"] },
      { nameKey: "tools.handwriting.name",  descKey: "home.bene.handwriting",  iconName: "handwriting",  to: "/tools/handwriting",    tags: ["手写"] },
      { nameKey: "tools.imageToTable.name", descKey: "home.bene.imageToTable", iconName: "imageToTable", to: "/tools/image-to-table", tags: ["表格", "CSV"] },
    ],
  },
  {
    id: "social", titleKey: "home.scene.social", subKey: "home.scene.social_sub", accent: "#7c3aed",
    tools: [
      { nameKey: "tools.idPhoto.name",       descKey: "home.bene.idPhoto",       iconName: "idPhoto",       to: "/tools/id-photo",       tags: ["证件"] },
      { nameKey: "tools.removeBg.name",      descKey: "home.bene.removeBg",      iconName: "removeBg",      to: "/tools/remove-bg",      tags: ["抠图"] },
      { nameKey: "tools.imageCompress.name", descKey: "home.bene.imageCompress", iconName: "imageCompress", to: "/tools/image-compress", tags: ["压缩"] },
      { nameKey: "tools.upscale.name",       descKey: "home.bene.upscale",       iconName: "upscale",       to: "/tools/upscale",        tags: ["放大"] },
      { nameKey: "tools.palette.name",       descKey: "home.bene.palette",       iconName: "palette",       to: "/tools/palette",        tags: ["色板"] },
    ],
  },
  {
    id: "av", titleKey: "home.scene.av", subKey: "home.scene.av_sub", accent: "#0891b2",
    tools: [
      { nameKey: "tools.videoCompress.name", descKey: "home.bene.videoCompress", iconName: "videoCompress", to: "/tools/video-compress", tags: ["压缩"] },
      { nameKey: "tools.videoToGif.name",    descKey: "home.bene.videoToGif",    iconName: "videoToGif",    to: "/tools/video-to-gif",   tags: ["GIF"] },
      { nameKey: "tools.whisper.name",       descKey: "home.bene.whisper",       iconName: "whisper",       to: "/tools/whisper",        tags: ["转文字"] },
    ],
  },
  {
    id: "dev", titleKey: "home.scene.dev", subKey: "home.scene.dev_sub", accent: "#4f46e5",
    tools: [
      { nameKey: "tools.jsonFormatter.name",   descKey: "home.bene.jsonFormatter",   iconName: "json",       to: "/tools/json",      tags: ["JSON", "查询"] },
      { nameKey: "tools.markdownPreview.name", descKey: "home.bene.markdownPreview", iconName: "markdown",   to: "/tools/markdown",  tags: ["Markdown"] },
      { nameKey: "tools.naming.name",          descKey: "home.bene.naming",          iconName: "naming",     to: "/tools/naming",    tags: ["命名"] },
      { nameKey: "tools.cron.name",            descKey: "home.bene.cron",            iconName: "cron",       to: "/tools/cron",      tags: ["Cron"] },
      { nameKey: "tools.timestamp.name",       descKey: "home.bene.timestamp",       iconName: "timestamp",  to: "/tools/timestamp", tags: ["时间"] },
      { nameKey: "tools.flowchart.name",       descKey: "home.bene.flowchart",       iconName: "flowchart",  to: "/tools/flowchart", tags: ["流程图"] },
      { nameKey: "tools.base64.name",          descKey: "home.bene.base64",          iconName: "base64",     to: "/tools/base64",    tags: ["编解码"] },
      { nameKey: "tools.qrcode.name",          descKey: "home.bene.qrcode",          iconName: "qrcode",     to: "/tools/qrcode",    tags: ["QR"] },
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
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px" }}>
        {/* ── Hero ─────────────────────────────────── */}
        <section
          style={{
            padding: "96px 0 32px",
            position: "relative",
          }}
        >
          {/* Soft eyebrow with gradient highlight */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 22,
              padding: "4px 12px 4px 4px",
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: 999,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 999,
                background: "var(--gradient-brand)",
                color: "#fff",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              NEW
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              {t("home.eyebrow")}
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(36px, 5.6vw, 60px)",
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.05,
              color: "var(--text-primary)",
              maxWidth: 840,
            }}
          >
            {t("home.heroTitleA")}
            <br />
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("home.heroTitleB")}
            </span>
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "var(--text-secondary)",
              marginTop: 20,
              maxWidth: 620,
              lineHeight: 1.55,
              fontWeight: 400,
              letterSpacing: -0.15,
            }}
          >
            {t("home.heroSub")}
          </p>

          {/* Painkiller spotlight — hero-weight featured row */}
          <div
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 10,
            }}
          >
            {PAINKILLERS.map((p, i) => (
              <Link
                key={i}
                to={p.to}
                style={{
                  textDecoration: "none",
                  padding: "18px 16px",
                  borderRadius: 14,
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  transition: "all 0.18s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(-2px)";
                  el.style.borderColor = p.accent;
                  el.style.boxShadow = `0 12px 28px -12px ${p.accent}44, 0 0 0 1px ${p.accent}2e`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(0)";
                  el.style.borderColor = "var(--border)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${p.accent}, ${p.accent}cc)`,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 4px 14px -4px ${p.accent}66`,
                  }}
                >
                  <ToolIcon name={p.iconName} size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: -0.2,
                      marginBottom: 2,
                    }}
                  >
                    {t(p.nameKey)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      lineHeight: 1.45,
                    }}
                  >
                    {t(p.taglineKey)}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginTop: 28, position: "relative", maxWidth: 460 }}>
            <SearchIcon />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              style={{
                width: "100%",
                padding: "11px 14px 11px 40px",
                borderRadius: 10,
                border: "1px solid var(--border-strong)",
                background: "#ffffff",
                fontSize: 13.5,
                color: "var(--text-primary)",
                outline: "none",
                letterSpacing: -0.1,
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--brand)";
                e.target.style.boxShadow = "var(--shadow-glow)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-strong)";
                e.target.style.boxShadow = "none";
              }}
            />
            {q && (
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>
                {t("home.pageSubMatch", { n: totalAfterFilter, total: TOTAL_TOOLS })}
              </div>
            )}
          </div>
        </section>

        {/* ── Categories ───────────────────────────── */}
        <div style={{ paddingTop: 40 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              {t("home.noResults")}
            </div>
          ) : (
            filtered.map((cat, idx) => (
              <section
                id={`cat-${cat.id}`}
                key={cat.id}
                style={{
                  paddingTop: idx === 0 ? 0 : 60,
                  paddingBottom: 0,
                  scrollMarginTop: 80,
                }}
              >
                <CategoryHeader
                  index={idx + 1}
                  title={t(cat.titleKey)}
                  sub={t(cat.subKey)}
                  count={cat.tools.length}
                  accent={cat.accent}
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
        </div>

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

function CategoryHeader({ index, title, sub, count, accent }) {
  const numStr = String(index).padStart(2, "0");
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: accent,
            fontWeight: 600,
            letterSpacing: 0.8,
          }}
        >
          {numStr}
        </span>
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
          {title}
        </h2>
        <span
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontWeight: 400,
            fontFamily: "var(--font-mono)",
          }}
        >
          {count}
        </span>
      </div>
      {sub && (
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            paddingLeft: 38,
            fontWeight: 400,
            letterSpacing: -0.05,
            lineHeight: 1.55,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function ComparisonTable() {
  const { t } = useTranslation();
  const rows = [
    { keyBase: "cmp.r_access",  ot: "cmp.ot.access",  others: ["cmp.removebg.access", "cmp.photoshop.access","cmp.chatgpt.access",  "cmp.studio.access"] },
    { keyBase: "cmp.r_signup",  ot: "cmp.ot.signup",  others: ["cmp.removebg.signup", "cmp.photoshop.signup","cmp.chatgpt.signup",  "cmp.studio.signup"] },
    { keyBase: "cmp.r_upload",  ot: "cmp.ot.upload",  others: ["cmp.removebg.upload", "cmp.photoshop.upload","cmp.chatgpt.upload",  "cmp.studio.upload"] },
    { keyBase: "cmp.r_offline", ot: "cmp.ot.offline", others: ["cmp.removebg.offline","cmp.photoshop.offline","cmp.chatgpt.offline", "cmp.studio.offline"] },
    { keyBase: "cmp.r_batch",   ot: "cmp.ot.batch",   others: ["cmp.removebg.batch",  "cmp.photoshop.batch", "cmp.chatgpt.batch",   "cmp.studio.batch"] },
  ];
  const competitors = ["Remove.bg", "Photoshop", "ChatGPT Plus", t("cmp.studio")];

  const cell = {
    padding: "14px 16px",
    borderBottom: "1px solid var(--border-light)",
    fontSize: 13,
    color: "var(--text-secondary)",
    letterSpacing: -0.05,
    verticalAlign: "top",
  };

  return (
    <section style={{ paddingTop: 84, paddingBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--brand)",
            fontWeight: 600,
            letterSpacing: 0.8,
          }}
        >
          06
        </span>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.5,
          }}
        >
          {t("cmp.title")}
        </h2>
      </div>
      <p
        style={{
          fontSize: 13.5,
          color: "var(--text-muted)",
          marginBottom: 20,
          paddingLeft: 38,
          lineHeight: 1.55,
          maxWidth: 700,
        }}
      >
        {t("cmp.sub")}
      </p>
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--border)",
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ ...cell, background: "#fafbfd" }} />
                <th
                  style={{
                    ...cell,
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#ffffff",
                    fontSize: 13.5,
                    letterSpacing: -0.15,
                    background: "var(--gradient-brand)",
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
                      background: "#fafbfd",
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
                      background: "#fafbfd",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t(r.keyBase)}
                  </td>
                  <td
                    style={{
                      ...cell,
                      color: "var(--brand-strong)",
                      fontWeight: 600,
                      background: "rgba(79, 70, 229, 0.04)",
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
    <section style={{ paddingTop: 64, paddingBottom: 120 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
            fontWeight: 600,
            letterSpacing: 0.8,
          }}
        >
          07
        </span>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: -0.5,
          }}
        >
          {t("home.upcomingTools")}
        </h2>
        <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
          {items.length}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 38 }}>
        {items.map((label, i) => (
          <span
            key={i}
            style={{
              padding: "6px 12px",
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
