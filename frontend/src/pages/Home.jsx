import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import SEO, { schema } from "../components/SEO";

// Tool catalog — category + accent per tool, used for filter + card color
const ALL_TOOLS = [
  // Privacy
  { cat: "privacy", nameKey: "tools.fileEncrypt.name",     descKey: "home.bene.fileEncrypt",     iconName: "fileEncrypt",     accent: "#059669", to: "/tools/file-encrypt" },
  { cat: "privacy", nameKey: "tools.exif.name",            descKey: "home.bene.exif",            iconName: "exif",            accent: "#059669", to: "/tools/exif" },
  { cat: "privacy", nameKey: "tools.removeWatermark.name", descKey: "home.bene.removeWatermark", iconName: "removeWatermark", accent: "#db2777", to: "/tools/remove-watermark" },

  // Docs
  { cat: "doc", nameKey: "tools.pdf.name",          descKey: "home.bene.pdf",          iconName: "pdf",          accent: "#ea580c", to: "/tools/pdf" },
  { cat: "doc", nameKey: "tools.pdfSummary.name",   descKey: "home.bene.pdfSummary",   iconName: "pdfSummary",   accent: "#dc2626", to: "/tools/pdf-summary" },
  { cat: "doc", nameKey: "tools.ocr.name",          descKey: "home.bene.ocr",          iconName: "ocr",          accent: "#4f46e5", to: "/tools/ocr" },
  { cat: "doc", nameKey: "tools.handwriting.name",  descKey: "home.bene.handwriting",  iconName: "handwriting",  accent: "#7c3aed", to: "/tools/handwriting" },
  { cat: "doc", nameKey: "tools.imageToTable.name", descKey: "home.bene.imageToTable", iconName: "imageToTable", accent: "#0891b2", to: "/tools/image-to-table" },

  // Image / Social
  { cat: "image", nameKey: "tools.idPhoto.name",       descKey: "home.bene.idPhoto",       iconName: "idPhoto",       accent: "#d97706", to: "/tools/id-photo" },
  { cat: "image", nameKey: "tools.removeBg.name",      descKey: "home.bene.removeBg",      iconName: "removeBg",      accent: "#7c3aed", to: "/tools/remove-bg" },
  { cat: "image", nameKey: "tools.imageCompress.name", descKey: "home.bene.imageCompress", iconName: "imageCompress", accent: "#ea580c", to: "/tools/image-compress" },
  { cat: "image", nameKey: "tools.upscale.name",       descKey: "home.bene.upscale",       iconName: "upscale",       accent: "#4f46e5", to: "/tools/upscale" },
  { cat: "image", nameKey: "tools.palette.name",       descKey: "home.bene.palette",       iconName: "palette",       accent: "#db2777", to: "/tools/palette" },

  // Audio / Video
  { cat: "av", nameKey: "tools.videoCompress.name", descKey: "home.bene.videoCompress", iconName: "videoCompress", accent: "#dc2626", to: "/tools/video-compress" },
  { cat: "av", nameKey: "tools.videoToGif.name",    descKey: "home.bene.videoToGif",    iconName: "videoToGif",    accent: "#db2777", to: "/tools/video-to-gif" },
  { cat: "av", nameKey: "tools.whisper.name",       descKey: "home.bene.whisper",       iconName: "whisper",       accent: "#0891b2", to: "/tools/whisper" },

  // Dev
  { cat: "dev", nameKey: "tools.jsonFormatter.name",   descKey: "home.bene.jsonFormatter",   iconName: "json",       accent: "#4f46e5", to: "/tools/json" },
  { cat: "dev", nameKey: "tools.markdownPreview.name", descKey: "home.bene.markdownPreview", iconName: "markdown",   accent: "#0d9488", to: "/tools/markdown" },
  { cat: "dev", nameKey: "tools.naming.name",          descKey: "home.bene.naming",          iconName: "naming",     accent: "#7c3aed", to: "/tools/naming" },
  { cat: "dev", nameKey: "tools.cron.name",            descKey: "home.bene.cron",            iconName: "cron",       accent: "#059669", to: "/tools/cron" },
  { cat: "dev", nameKey: "tools.timestamp.name",       descKey: "home.bene.timestamp",       iconName: "timestamp",  accent: "#db2777", to: "/tools/timestamp" },
  { cat: "dev", nameKey: "tools.flowchart.name",       descKey: "home.bene.flowchart",       iconName: "flowchart",  accent: "#0d9488", to: "/tools/flowchart" },
  { cat: "dev", nameKey: "tools.base64.name",          descKey: "home.bene.base64",          iconName: "base64",     accent: "#2563eb", to: "/tools/base64" },
  { cat: "dev", nameKey: "tools.qrcode.name",          descKey: "home.bene.qrcode",          iconName: "qrcode",     accent: "#0f172a", to: "/tools/qrcode" },
];

const TABS = [
  { id: "all",     labelKey: "home.tab.all" },
  { id: "privacy", labelKey: "home.cat.privacy" },
  { id: "doc",     labelKey: "home.cat.doc" },
  { id: "image",   labelKey: "home.cat.image" },
  { id: "av",      labelKey: "home.cat.av" },
  { id: "dev",     labelKey: "home.cat.dev" },
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
    for (const tool of ALL_TOOLS) {
      m[tool.cat] = (m[tool.cat] || 0) + 1;
    }
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

      {/* ── Hero — centered, big search focused (TinyWow style) ─ */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "72px 24px 40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(38px, 6vw, 64px)",
            fontWeight: 700,
            letterSpacing: -2.2,
            lineHeight: 1.05,
            color: "var(--text-primary)",
            maxWidth: 820,
            margin: "0 auto",
          }}
        >
          {t("home.heroTitleA")}{" "}
          <span style={{ color: "var(--brand-strong)" }}>
            {t("home.heroTitleB")}
          </span>
        </h1>
        <p
          style={{
            fontSize: 17.5,
            color: "var(--text-secondary)",
            marginTop: 18,
            maxWidth: 560,
            margin: "18px auto 0",
            lineHeight: 1.55,
            fontWeight: 400,
            letterSpacing: -0.2,
          }}
        >
          {t("home.heroSub")}
        </p>

        {/* Prominent search */}
        <div
          style={{
            marginTop: 36,
            position: "relative",
            maxWidth: 560,
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
              padding: "16px 18px 16px 50px",
              borderRadius: 14,
              border: "1px solid var(--border-strong)",
              background: "#ffffff",
              fontSize: 15,
              color: "var(--text-primary)",
              outline: "none",
              letterSpacing: -0.15,
              boxShadow: "var(--shadow-md)",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--brand)";
              e.target.style.boxShadow = "var(--shadow-glow)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border-strong)";
              e.target.style.boxShadow = "var(--shadow-md)";
            }}
          />
        </div>
      </section>

      {/* ── Category tabs ─────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "saturate(180%) blur(12px)",
          WebkitBackdropFilter: "saturate(180%) blur(12px)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: active
                    ? "1px solid var(--brand-strong)"
                    : "1px solid var(--border)",
                  background: active ? "var(--brand-strong)" : "#ffffff",
                  color: active ? "#ffffff" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: -0.1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "all 0.15s ease",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                }}
              >
                {t(tab.labelKey)}
                <span
                  style={{
                    fontSize: 11,
                    padding: "1px 7px",
                    borderRadius: 999,
                    background: active
                      ? "rgba(255,255,255,0.22)"
                      : "var(--bg-subtle)",
                    color: active ? "#ffffff" : "var(--text-muted)",
                    fontWeight: 600,
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
          padding: "40px 24px 80px",
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
              gap: 14,
            }}
          >
            {filtered.map((tool, i) => (
              <GridCard
                key={i}
                to={tool.to}
                icon={tool.iconName}
                accent={tool.accent}
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

function GridCard({ to, icon, accent, name, desc }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        display: "block",
        padding: "22px 20px",
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid var(--border)",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = accent;
        el.style.boxShadow = `0 8px 24px -8px ${accent}40, 0 0 0 1px ${accent}33`;
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--border)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          background: `${accent}14`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <ToolIcon name={icon} size={28} />
      </div>
      <div
        style={{
          fontSize: 15.5,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: -0.3,
          marginBottom: 6,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          lineHeight: 1.55,
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
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth="2"
      strokeLinecap="round"
      style={{
        position: "absolute",
        left: 17,
        top: "50%",
        transform: "translateY(-50%)",
      }}
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M14 14l4 4" />
    </svg>
  );
}
