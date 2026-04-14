import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import SEO, { schema } from "../components/SEO";

const ALL_TOOLS = [
  // Privacy
  { cat: "privacy", to: "/tools/file-encrypt",     nameKey: "tools.fileEncrypt.name",     descKey: "home.bene.fileEncrypt",     iconName: "fileEncrypt",     accent: "#059669" },
  { cat: "privacy", to: "/tools/exif",             nameKey: "tools.exif.name",            descKey: "home.bene.exif",            iconName: "exif",            accent: "#0891b2" },
  { cat: "privacy", to: "/tools/remove-watermark", nameKey: "tools.removeWatermark.name", descKey: "home.bene.removeWatermark", iconName: "removeWatermark", accent: "#db2777" },

  // Docs
  { cat: "doc", to: "/tools/pdf",            nameKey: "tools.pdf.name",          descKey: "home.bene.pdf",          iconName: "pdf",          accent: "#ea580c" },
  { cat: "doc", to: "/tools/pdf-summary",    nameKey: "tools.pdfSummary.name",   descKey: "home.bene.pdfSummary",   iconName: "pdfSummary",   accent: "#dc2626" },
  { cat: "doc", to: "/tools/ocr",            nameKey: "tools.ocr.name",          descKey: "home.bene.ocr",          iconName: "ocr",          accent: "#4f46e5" },
  { cat: "doc", to: "/tools/handwriting",    nameKey: "tools.handwriting.name",  descKey: "home.bene.handwriting",  iconName: "handwriting",  accent: "#7c3aed" },
  { cat: "doc", to: "/tools/image-to-table", nameKey: "tools.imageToTable.name", descKey: "home.bene.imageToTable", iconName: "imageToTable", accent: "#0d9488" },

  // Image
  { cat: "image", to: "/tools/id-photo",       nameKey: "tools.idPhoto.name",       descKey: "home.bene.idPhoto",       iconName: "idPhoto",       accent: "#d97706" },
  { cat: "image", to: "/tools/remove-bg",      nameKey: "tools.removeBg.name",      descKey: "home.bene.removeBg",      iconName: "removeBg",      accent: "#7c3aed" },
  { cat: "image", to: "/tools/image-compress", nameKey: "tools.imageCompress.name", descKey: "home.bene.imageCompress", iconName: "imageCompress", accent: "#ea580c" },
  { cat: "image", to: "/tools/upscale",        nameKey: "tools.upscale.name",       descKey: "home.bene.upscale",       iconName: "upscale",       accent: "#4f46e5" },
  { cat: "image", to: "/tools/palette",        nameKey: "tools.palette.name",       descKey: "home.bene.palette",       iconName: "palette",       accent: "#db2777" },

  // Audio / Video
  { cat: "av", to: "/tools/video-compress", nameKey: "tools.videoCompress.name", descKey: "home.bene.videoCompress", iconName: "videoCompress", accent: "#dc2626" },
  { cat: "av", to: "/tools/video-to-gif",   nameKey: "tools.videoToGif.name",    descKey: "home.bene.videoToGif",    iconName: "videoToGif",    accent: "#db2777" },
  { cat: "av", to: "/tools/whisper",        nameKey: "tools.whisper.name",       descKey: "home.bene.whisper",       iconName: "whisper",       accent: "#0891b2" },

  // Dev
  { cat: "dev", to: "/tools/json",      nameKey: "tools.jsonFormatter.name",   descKey: "home.bene.jsonFormatter",   iconName: "json",       accent: "#4f46e5" },
  { cat: "dev", to: "/tools/markdown",  nameKey: "tools.markdownPreview.name", descKey: "home.bene.markdownPreview", iconName: "markdown",   accent: "#0d9488" },
  { cat: "dev", to: "/tools/naming",    nameKey: "tools.naming.name",          descKey: "home.bene.naming",          iconName: "naming",     accent: "#7c3aed" },
  { cat: "dev", to: "/tools/cron",      nameKey: "tools.cron.name",            descKey: "home.bene.cron",            iconName: "cron",       accent: "#059669" },
  { cat: "dev", to: "/tools/timestamp", nameKey: "tools.timestamp.name",       descKey: "home.bene.timestamp",       iconName: "timestamp",  accent: "#db2777" },
  { cat: "dev", to: "/tools/flowchart", nameKey: "tools.flowchart.name",       descKey: "home.bene.flowchart",       iconName: "flowchart",  accent: "#0d9488" },
  { cat: "dev", to: "/tools/base64",    nameKey: "tools.base64.name",          descKey: "home.bene.base64",          iconName: "base64",     accent: "#2563eb" },
  { cat: "dev", to: "/tools/qrcode",    nameKey: "tools.qrcode.name",          descKey: "home.bene.qrcode",          iconName: "qrcode",     accent: "#0f172a" },
];

const CAT_META = {
  privacy: { labelKey: "home.cat.privacy", badgeBg: "#dcfce7", badgeColor: "#15803d", border: "#bbf7d0" },
  doc:     { labelKey: "home.cat.doc",     badgeBg: "#fed7aa", badgeColor: "#c2410c", border: "#fdba74" },
  image:   { labelKey: "home.cat.image",   badgeBg: "#ede9fe", badgeColor: "#6d28d9", border: "#ddd6fe" },
  av:      { labelKey: "home.cat.av",      badgeBg: "#fce7f3", badgeColor: "#be185d", border: "#fbcfe8" },
  dev:     { labelKey: "home.cat.dev",     badgeBg: "#dbeafe", badgeColor: "#1d4ed8", border: "#bfdbfe" },
};

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
  const [params, setParams] = useSearchParams();
  const urlCat = params.get("cat");
  const [q, setQ] = useState("");
  const activeTab = urlCat && TABS.some((ti) => ti.id === urlCat) ? urlCat : "all";

  const setTab = (id) => {
    if (id === "all") setParams({});
    else setParams({ cat: id });
  };

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

  return (
    <>
      <SEO
        title={t("home.title")}
        description={t("home.subtitle")}
        path="/"
        structuredData={schema.website({ url: "https://onetools.dev" })}
      />

      {/* Page header — Aloom style */}
      <header
        style={{
          padding: "28px 36px 0",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: -0.6,
                color: "#0f172a",
              }}
            >
              {t("home.pageTitle")}
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: "#64748b",
                marginTop: 4,
                letterSpacing: -0.1,
              }}
            >
              {t("home.pageSub")}
            </p>
          </div>
          <a
            href="https://github.com/grl2345/OneTools"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "#0f172a",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              letterSpacing: -0.1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M7 2v10M2 7h10" />
            </svg>
            {t("home.cta")}
          </a>
        </div>

        {/* Tabs + search row — underline style, NO emoji */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 0,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  style={{
                    padding: "10px 18px",
                    background: "transparent",
                    border: "none",
                    borderBottom: active ? "2px solid #0f172a" : "2px solid transparent",
                    color: active ? "#0f172a" : "#64748b",
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    marginBottom: -1,
                    letterSpacing: -0.1,
                    transition: "color 0.12s ease",
                  }}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
          <div
            style={{
              position: "relative",
              minWidth: 220,
              paddingBottom: 8,
            }}
          >
            <SearchIcon />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                fontSize: 12.5,
                color: "#0f172a",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#84cc16")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
        </div>
      </header>

      {/* Tool grid */}
      <main style={{ padding: "24px 36px 72px" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "80px 20px",
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
            }}
          >
            {t("home.noResults")}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 14,
            }}
          >
            {filtered.map((tool, i) => (
              <AloomCard
                key={i}
                tool={tool}
                name={t(tool.nameKey)}
                desc={t(tool.descKey)}
                catLabel={t(CAT_META[tool.cat].labelKey)}
                catMeta={CAT_META[tool.cat]}
                openLabel={t("home.cardOpen")}
                previewLabel={t("home.cardPreview")}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function AloomCard({ tool, name, desc, catLabel, catMeta, openLabel, previewLabel }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#bef264";
        e.currentTarget.style.boxShadow =
          "0 0 0 3px rgba(190,242,100,0.25), 0 8px 24px -12px rgba(15,23,42,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `${tool.accent}14`,
            color: tool.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ToolIcon name={tool.iconName} size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#0f172a",
              letterSpacing: -0.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
        </div>
        <span
          style={{
            padding: "2px 9px",
            borderRadius: 999,
            background: catMeta.badgeBg,
            color: catMeta.badgeColor,
            border: `1px solid ${catMeta.border}`,
            fontSize: 10.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
            letterSpacing: 0,
          }}
        >
          {catLabel}
        </span>
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: "#64748b",
          lineHeight: 1.55,
          fontWeight: 400,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: 38,
        }}
      >
        {desc}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <Link
          to={tool.to}
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: 8,
            background: "#ffffff",
            color: "#475569",
            border: "1px solid #e5e7eb",
            fontSize: 12.5,
            fontWeight: 500,
            textAlign: "center",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.12s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          {previewLabel}
        </Link>
        <Link
          to={tool.to}
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: 8,
            background: "#0f172a",
            color: "#ffffff",
            fontSize: 12.5,
            fontWeight: 600,
            textAlign: "center",
            textDecoration: "none",
            cursor: "pointer",
            letterSpacing: -0.1,
          }}
        >
          {openLabel}
        </Link>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="1.6"
      strokeLinecap="round"
      style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}
    >
      <circle cx="6" cy="6" r="4.5" />
      <path d="M10 10l3 3" />
    </svg>
  );
}
