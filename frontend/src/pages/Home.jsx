import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import SEO, { schema } from "../components/SEO";

// TinyWow-style: each tool gets a soft pastel card background + bold accent
// for its icon. Icon bg uses white-in-pastel-card, accent for the icon color.
const ALL_TOOLS = [
  // Privacy
  { cat: "privacy", to: "/tools/file-encrypt",     nameKey: "tools.fileEncrypt.name",     descKey: "home.bene.fileEncrypt",     iconName: "fileEncrypt",     accent: "#059669", bg: "#ecfdf5" },
  { cat: "privacy", to: "/tools/exif",             nameKey: "tools.exif.name",            descKey: "home.bene.exif",            iconName: "exif",            accent: "#0891b2", bg: "#ecfeff" },
  { cat: "privacy", to: "/tools/remove-watermark", nameKey: "tools.removeWatermark.name", descKey: "home.bene.removeWatermark", iconName: "removeWatermark", accent: "#db2777", bg: "#fdf2f8" },

  // Docs
  { cat: "doc", to: "/tools/pdf",            nameKey: "tools.pdf.name",          descKey: "home.bene.pdf",          iconName: "pdf",          accent: "#ea580c", bg: "#fff7ed" },
  { cat: "doc", to: "/tools/pdf-summary",    nameKey: "tools.pdfSummary.name",   descKey: "home.bene.pdfSummary",   iconName: "pdfSummary",   accent: "#dc2626", bg: "#fef2f2" },
  { cat: "doc", to: "/tools/ocr",            nameKey: "tools.ocr.name",          descKey: "home.bene.ocr",          iconName: "ocr",          accent: "#4f46e5", bg: "#eef2ff" },
  { cat: "doc", to: "/tools/handwriting",    nameKey: "tools.handwriting.name",  descKey: "home.bene.handwriting",  iconName: "handwriting",  accent: "#7c3aed", bg: "#f5f3ff" },
  { cat: "doc", to: "/tools/image-to-table", nameKey: "tools.imageToTable.name", descKey: "home.bene.imageToTable", iconName: "imageToTable", accent: "#0d9488", bg: "#f0fdfa" },

  // Image
  { cat: "image", to: "/tools/id-photo",       nameKey: "tools.idPhoto.name",       descKey: "home.bene.idPhoto",       iconName: "idPhoto",       accent: "#d97706", bg: "#fffbeb" },
  { cat: "image", to: "/tools/remove-bg",      nameKey: "tools.removeBg.name",      descKey: "home.bene.removeBg",      iconName: "removeBg",      accent: "#7c3aed", bg: "#f5f3ff" },
  { cat: "image", to: "/tools/image-compress", nameKey: "tools.imageCompress.name", descKey: "home.bene.imageCompress", iconName: "imageCompress", accent: "#ea580c", bg: "#fff7ed" },
  { cat: "image", to: "/tools/upscale",        nameKey: "tools.upscale.name",       descKey: "home.bene.upscale",       iconName: "upscale",       accent: "#4f46e5", bg: "#eef2ff" },
  { cat: "image", to: "/tools/palette",        nameKey: "tools.palette.name",       descKey: "home.bene.palette",       iconName: "palette",       accent: "#db2777", bg: "#fdf2f8" },

  // Audio / Video
  { cat: "av", to: "/tools/video-compress", nameKey: "tools.videoCompress.name", descKey: "home.bene.videoCompress", iconName: "videoCompress", accent: "#dc2626", bg: "#fef2f2" },
  { cat: "av", to: "/tools/video-to-gif",   nameKey: "tools.videoToGif.name",    descKey: "home.bene.videoToGif",    iconName: "videoToGif",    accent: "#db2777", bg: "#fdf2f8" },
  { cat: "av", to: "/tools/whisper",        nameKey: "tools.whisper.name",       descKey: "home.bene.whisper",       iconName: "whisper",       accent: "#0891b2", bg: "#ecfeff" },

  // Dev
  { cat: "dev", to: "/tools/json",      nameKey: "tools.jsonFormatter.name",   descKey: "home.bene.jsonFormatter",   iconName: "json",       accent: "#4f46e5", bg: "#eef2ff" },
  { cat: "dev", to: "/tools/markdown",  nameKey: "tools.markdownPreview.name", descKey: "home.bene.markdownPreview", iconName: "markdown",   accent: "#0d9488", bg: "#f0fdfa" },
  { cat: "dev", to: "/tools/naming",    nameKey: "tools.naming.name",          descKey: "home.bene.naming",          iconName: "naming",     accent: "#7c3aed", bg: "#f5f3ff" },
  { cat: "dev", to: "/tools/cron",      nameKey: "tools.cron.name",            descKey: "home.bene.cron",            iconName: "cron",       accent: "#059669", bg: "#ecfdf5" },
  { cat: "dev", to: "/tools/timestamp", nameKey: "tools.timestamp.name",       descKey: "home.bene.timestamp",       iconName: "timestamp",  accent: "#db2777", bg: "#fdf2f8" },
  { cat: "dev", to: "/tools/flowchart", nameKey: "tools.flowchart.name",       descKey: "home.bene.flowchart",       iconName: "flowchart",  accent: "#0d9488", bg: "#f0fdfa" },
  { cat: "dev", to: "/tools/base64",    nameKey: "tools.base64.name",          descKey: "home.bene.base64",          iconName: "base64",     accent: "#2563eb", bg: "#eff6ff" },
  { cat: "dev", to: "/tools/qrcode",    nameKey: "tools.qrcode.name",          descKey: "home.bene.qrcode",          iconName: "qrcode",     accent: "#0f172a", bg: "#f1f5f9" },
];

const TABS = [
  { id: "all",     labelKey: "home.tab.all",     emoji: "🎯" },
  { id: "privacy", labelKey: "home.cat.privacy", emoji: "🔒" },
  { id: "doc",     labelKey: "home.cat.doc",     emoji: "📄" },
  { id: "image",   labelKey: "home.cat.image",   emoji: "🖼️" },
  { id: "av",      labelKey: "home.cat.av",      emoji: "🎬" },
  { id: "dev",     labelKey: "home.cat.dev",     emoji: "💻" },
];

export default function Home() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return ALL_TOOLS.filter((tool) => {
      if (activeTab !== "all" && tool.cat !== activeTab) return false;
      if (!query) return true;
      const n = t(tool.nameKey).toLowerCase();
      const d = t(tool.descKey).toLowerCase();
      return n.includes(query) || d.includes(query);
    });
  }, [q, activeTab, t]);

  const countByTab = useMemo(() => {
    const m = { all: ALL_TOOLS.length };
    for (const tool of ALL_TOOLS) m[tool.cat] = (m[tool.cat] || 0) + 1;
    return m;
  }, []);

  return (
    <>
      <SEO
        title={t("home.title")}
        description={t("home.subtitle")}
        path="/"
        structuredData={schema.website({ url: "https://onetools.dev" })}
      />

      {/* ── Hero with lime-tinted background ────────── */}
      <section
        style={{
          background:
            "linear-gradient(180deg, #ecfccb 0%, #f7fee7 40%, #ffffff 100%)",
          padding: "64px 24px 72px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -40,
            left: "8%",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "#a3e635",
            opacity: 0.25,
            filter: "blur(20px)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 40,
            right: "6%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "#84cc16",
            opacity: 0.15,
            filter: "blur(40px)",
          }}
        />

        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "#ffffff",
              border: "1px solid #d9f99d",
              fontSize: 12.5,
              color: "#4d7c0f",
              fontWeight: 600,
              marginBottom: 24,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <span style={{ fontSize: 14 }}>✨</span>
            {t("home.eyebrow")}
          </div>

          <h1
            style={{
              fontSize: "clamp(44px, 7vw, 78px)",
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1,
              color: "#0f172a",
            }}
          >
            {t("home.heroTitleA")}{" "}
            <span
              style={{
                display: "inline-block",
                background: "#c1ed3e",
                padding: "0 14px",
                borderRadius: 12,
                transform: "rotate(-1.5deg)",
                boxShadow: "0 4px 0 rgba(77, 124, 15, 0.3)",
              }}
            >
              {t("home.heroTitleB")}
            </span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "#334155",
              marginTop: 22,
              maxWidth: 560,
              margin: "22px auto 0",
              lineHeight: 1.5,
              fontWeight: 500,
              letterSpacing: -0.15,
            }}
          >
            {t("home.heroSub")}
          </p>

          {/* Big search */}
          <div
            style={{
              marginTop: 36,
              position: "relative",
              maxWidth: 580,
              margin: "36px auto 0",
            }}
          >
            <SearchIcon />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              style={{
                width: "100%",
                padding: "18px 20px 18px 56px",
                borderRadius: 999,
                border: "2px solid #0f172a",
                background: "#ffffff",
                fontSize: 15,
                color: "#0f172a",
                outline: "none",
                letterSpacing: -0.15,
                boxShadow: "0 4px 0 #0f172a",
                fontWeight: 500,
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = "0 4px 0 #65a30d";
                e.target.style.borderColor = "#65a30d";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "0 4px 0 #0f172a";
                e.target.style.borderColor = "#0f172a";
              }}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 12.5,
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            {t("home.heroFoot", { n: ALL_TOOLS.length })}
          </div>
        </div>
      </section>

      {/* ── Category tabs ─────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "saturate(180%) blur(12px)",
          WebkitBackdropFilter: "saturate(180%) blur(12px)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 999,
                  border: active
                    ? "2px solid #0f172a"
                    : "2px solid transparent",
                  background: active ? "#c1ed3e" : "#f6f7f9",
                  color: "#0f172a",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: -0.1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.15s ease",
                  boxShadow: active ? "0 3px 0 #0f172a" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "#eef0f3";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "#f6f7f9";
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.emoji}</span>
                {t(tab.labelKey)}
                <span
                  style={{
                    fontSize: 11,
                    padding: "1px 7px",
                    borderRadius: 999,
                    background: active ? "#0f172a" : "#ffffff",
                    color: active ? "#c1ed3e" : "var(--text-muted)",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {countByTab[tab.id] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tool grid ─────────────────────────────── */}
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 96px",
        }}
      >
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((tool, i) => (
              <PastelCard
                key={i}
                to={tool.to}
                icon={tool.iconName}
                accent={tool.accent}
                bg={tool.bg}
                name={t(tool.nameKey)}
                desc={t(tool.descKey)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function PastelCard({ to, icon, accent, bg, name, desc }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        display: "block",
        padding: "22px 20px 20px",
        borderRadius: 20,
        background: bg,
        border: "2px solid transparent",
        transition: "all 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "#0f172a";
        el.style.transform = "translate(-2px, -2px)";
        el.style.boxShadow = "4px 4px 0 #0f172a";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "transparent";
        el.style.transform = "translate(0, 0)";
        el.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "#ffffff",
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          border: `2px solid ${accent}22`,
        }}
      >
        <ToolIcon name={icon} size={30} />
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#0f172a",
          letterSpacing: -0.3,
          marginBottom: 6,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#475569",
          lineHeight: 1.5,
          fontWeight: 400,
          letterSpacing: -0.05,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {desc}
      </div>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinecap="round"
      style={{
        position: "absolute",
        left: 20,
        top: "50%",
        transform: "translateY(-50%)",
      }}
    >
      <circle cx="10" cy="10" r="6.5" />
      <path d="M15 15l5 5" />
    </svg>
  );
}
