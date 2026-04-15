import { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import SEO, { schema } from "../components/SEO";
import FaqSection from "../components/FaqSection";

const ALL_TOOLS = [
  { cat: "image",   to: "/tools/remove-watermark", nameKey: "tools.removeWatermark.name", descKey: "home.bene.removeWatermark", iconName: "removeWatermark", accent: "#ec4899" },
  { cat: "image",   to: "/tools/remove-bg",        nameKey: "tools.removeBg.name",        descKey: "home.bene.removeBg",        iconName: "removeBg",        accent: "#a855f7" },
  { cat: "image",   to: "/tools/id-photo",         nameKey: "tools.idPhoto.name",         descKey: "home.bene.idPhoto",         iconName: "idPhoto",         accent: "#f59e0b" },
  { cat: "image",   to: "/tools/image-compress",   nameKey: "tools.imageCompress.name",   descKey: "home.bene.imageCompress",   iconName: "imageCompress",   accent: "#f97316" },
  { cat: "image",   to: "/tools/upscale",          nameKey: "tools.upscale.name",         descKey: "home.bene.upscale",         iconName: "upscale",         accent: "#6366f1" },
  { cat: "image",   to: "/tools/palette",          nameKey: "tools.palette.name",         descKey: "home.bene.palette",         iconName: "palette",         accent: "#ec4899" },

  { cat: "privacy", to: "/tools/file-encrypt",     nameKey: "tools.fileEncrypt.name",     descKey: "home.bene.fileEncrypt",     iconName: "fileEncrypt",     accent: "#10b981" },
  { cat: "privacy", to: "/tools/exif",             nameKey: "tools.exif.name",            descKey: "home.bene.exif",            iconName: "exif",            accent: "#06b6d4" },

  { cat: "doc", to: "/tools/pdf",            nameKey: "tools.pdf.name",          descKey: "home.bene.pdf",          iconName: "pdf",          accent: "#f97316" },
  { cat: "doc", to: "/tools/pdf-summary",    nameKey: "tools.pdfSummary.name",   descKey: "home.bene.pdfSummary",   iconName: "pdfSummary",   accent: "#ef4444" },
  { cat: "doc", to: "/tools/ocr",            nameKey: "tools.ocr.name",          descKey: "home.bene.ocr",          iconName: "ocr",          accent: "#6366f1" },
  { cat: "doc", to: "/tools/handwriting",    nameKey: "tools.handwriting.name",  descKey: "home.bene.handwriting",  iconName: "handwriting",  accent: "#a855f7" },
  { cat: "doc", to: "/tools/image-to-table", nameKey: "tools.imageToTable.name", descKey: "home.bene.imageToTable", iconName: "imageToTable", accent: "#14b8a6" },

  { cat: "av", to: "/tools/video-compress", nameKey: "tools.videoCompress.name", descKey: "home.bene.videoCompress", iconName: "videoCompress", accent: "#ef4444" },
  { cat: "av", to: "/tools/video-to-gif",   nameKey: "tools.videoToGif.name",    descKey: "home.bene.videoToGif",    iconName: "videoToGif",    accent: "#ec4899" },
  { cat: "av", to: "/tools/whisper",        nameKey: "tools.whisper.name",       descKey: "home.bene.whisper",       iconName: "whisper",       accent: "#06b6d4" },

  { cat: "dev", to: "/tools/json",      nameKey: "tools.jsonFormatter.name",   descKey: "home.bene.jsonFormatter",   iconName: "json",      accent: "#6366f1" },
  { cat: "dev", to: "/tools/markdown",  nameKey: "tools.markdownPreview.name", descKey: "home.bene.markdownPreview", iconName: "markdown",  accent: "#14b8a6" },
  { cat: "dev", to: "/tools/naming",    nameKey: "tools.naming.name",          descKey: "home.bene.naming",          iconName: "naming",    accent: "#a855f7" },
  { cat: "dev", to: "/tools/cron",      nameKey: "tools.cron.name",            descKey: "home.bene.cron",            iconName: "cron",      accent: "#10b981" },
  { cat: "dev", to: "/tools/timestamp", nameKey: "tools.timestamp.name",       descKey: "home.bene.timestamp",       iconName: "timestamp", accent: "#ec4899" },
  { cat: "dev", to: "/tools/flowchart", nameKey: "tools.flowchart.name",       descKey: "home.bene.flowchart",       iconName: "flowchart", accent: "#14b8a6" },
  { cat: "dev", to: "/tools/base64",    nameKey: "tools.base64.name",          descKey: "home.bene.base64",          iconName: "base64",    accent: "#3b82f6" },
  { cat: "dev", to: "/tools/qrcode",    nameKey: "tools.qrcode.name",          descKey: "home.bene.qrcode",          iconName: "qrcode",    accent: "#cbd5e1" },
];

const TABS = [
  { id: "all",     labelKey: "home.tab.all" },
  { id: "image",   labelKey: "home.cat.image" },
  { id: "privacy", labelKey: "home.cat.privacy" },
  { id: "doc",     labelKey: "home.cat.doc" },
  { id: "av",      labelKey: "home.cat.av" },
  { id: "dev",     labelKey: "home.cat.dev" },
];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

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

  const handleUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        sessionStorage.setItem(
          "onetools:pendingImage",
          JSON.stringify({ name: file.name, type: file.type, dataUrl: e.target.result })
        );
      } catch {}
      navigate("/tools/remove-watermark");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <SEO
        title={t("home.title")}
        description={t("home.subtitle")}
        path="/"
        structuredData={schema.website({ url: "https://onetools.dev" })}
      />

      {/* ── HERO ────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          padding: "72px 24px 96px",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--gradient-hero)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            maxWidth: 1080,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(168, 85, 247, 0.14)",
              border: "1px solid rgba(168, 85, 247, 0.32)",
              fontSize: 12.5,
              color: "#e9d5ff",
              fontWeight: 600,
              marginBottom: 26,
              letterSpacing: 0.2,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ec4899",
                boxShadow: "0 0 10px #ec4899",
              }}
            />
            {t("home.eyebrow")}
          </div>

          <h1
            style={{
              fontSize: "clamp(42px, 6.5vw, 72px)",
              fontWeight: 800,
              letterSpacing: -2.5,
              lineHeight: 1.05,
              color: "var(--text-primary)",
              marginBottom: 18,
            }}
          >
            {t("home.heroTitleA")}{" "}
            <span className="gradient-text" style={{ fontStyle: "italic" }}>
              {t("home.heroTitleB")}
            </span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--text-secondary)",
              maxWidth: 640,
              margin: "0 auto",
              lineHeight: 1.5,
              fontWeight: 450,
              letterSpacing: -0.15,
            }}
          >
            {t("home.heroSub")}
          </p>

          {/* Upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleUpload(e.dataTransfer.files?.[0]);
            }}
            style={{
              marginTop: 40,
              padding: "44px 28px",
              borderRadius: 22,
              border: `2px dashed ${dragging ? "#ec4899" : "rgba(168, 85, 247, 0.45)"}`,
              background: dragging
                ? "rgba(236, 72, 153, 0.08)"
                : "rgba(21, 21, 42, 0.55)",
              backdropFilter: "blur(6px)",
              boxShadow: dragging
                ? "0 0 0 4px rgba(236,72,153,0.15)"
                : "0 20px 60px -20px rgba(168, 85, 247, 0.3)",
              transition: "all 0.2s ease",
              position: "relative",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e.target.files?.[0])}
              style={{ display: "none" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: "var(--gradient-brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 12px 30px -6px rgba(168, 85, 247, 0.55)",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 16V4m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                    stroke="#fff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  className="btn-primary"
                  onClick={() => fileRef.current?.click()}
                  style={{ padding: "14px 30px", fontSize: 15 }}
                >
                  {t("home.uploadCta")}
                </button>
                <Link
                  to="/tools/remove-bg"
                  className="btn-ghost"
                  style={{ padding: "14px 24px", fontSize: 14 }}
                >
                  {t("home.tryBgRemove")}
                </Link>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  letterSpacing: -0.1,
                }}
              >
                {t("home.uploadHint")}
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div
            style={{
              marginTop: 26,
              display: "flex",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
              fontSize: 12.5,
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            <TrustPill icon="🔒" label={t("home.trust.privacy")} />
            <TrustPill icon="⚡" label={t("home.trust.fast")} />
            <TrustPill icon="✨" label={t("home.trust.free")} />
            <TrustPill icon="🧠" label={t("home.trust.ai")} />
          </div>
        </div>
      </section>

      {/* ── Two headline features ─── */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 40px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          <HeroFeature
            to="/tools/remove-watermark"
            titleKey="home.feature.rmwmTitle"
            descKey="home.feature.rmwmDesc"
            ctaKey="home.feature.cta"
            gradient="linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.18) 100%)"
            accent="#a855f7"
            t={t}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M9 6h9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <HeroFeature
            to="/tools/remove-bg"
            titleKey="home.feature.rmbgTitle"
            descKey="home.feature.rmbgDesc"
            ctaKey="home.feature.cta"
            gradient="linear-gradient(135deg, rgba(236, 72, 153, 0.22) 0%, rgba(251, 113, 133, 0.18) 100%)"
            accent="#ec4899"
            t={t}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" strokeWidth="2" />
                <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── How it works ─── */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 20px" }}>
        <SectionTitle
          eyebrow={t("home.how.eyebrow")}
          title={t("home.how.title")}
          sub={t("home.how.sub")}
        />
        <div
          style={{
            marginTop: 36,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
          }}
        >
          {[1, 2, 3].map((n) => (
            <StepCard
              key={n}
              num={n}
              title={t(`home.how.s${n}Title`)}
              desc={t(`home.how.s${n}Desc`)}
            />
          ))}
        </div>
      </section>

      {/* ── Tool directory ─── */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "64px 24px 24px",
        }}
      >
        <SectionTitle
          eyebrow={t("home.more.eyebrow")}
          title={t("home.more.title")}
          sub={t("home.more.sub")}
        />

        <div
          style={{
            marginTop: 28,
            position: "relative",
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <SearchIcon />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            style={{
              width: "100%",
              padding: "14px 20px 14px 48px",
              borderRadius: 999,
              border: "1px solid var(--border-strong)",
              background: "var(--bg-input)",
              fontSize: 14,
              color: "var(--text-primary)",
              outline: "none",
              letterSpacing: -0.1,
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
        </div>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 6,
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
                  border: active ? "1px solid transparent" : "1px solid var(--border)",
                  background: active ? "var(--gradient-brand)" : "rgba(10, 11, 20, 0.03)",
                  color: active ? "#fff" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: -0.1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: active ? "0 6px 16px -6px rgba(168,85,247,0.6)" : "none",
                }}
              >
                {t(tab.labelKey)}
                <span
                  style={{
                    fontSize: 11,
                    color: active ? "rgba(255,255,255,0.85)" : "var(--text-faint)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {countByTab[tab.id] || 0}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 32 }}>
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
                gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                gap: 14,
              }}
            >
              {filtered.map((tool, i) => (
                <DarkToolCard
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
        </div>
      </section>

      {/* ── FAQ ─── */}
      <section style={{ maxWidth: 860, margin: "64px auto 0", padding: "0 24px" }}>
        <FaqSection
          title={t("faq.title")}
          items={t("faq.home", { returnObjects: true })}
          path="/"
        />
      </section>

      {/* ── CTA band ─── */}
      <section
        style={{
          maxWidth: 960,
          margin: "32px auto 80px",
          padding: "48px 24px",
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.14), rgba(236,72,153,0.12))",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(28px, 3.5vw, 38px)",
            fontWeight: 800,
            letterSpacing: -1.2,
            color: "var(--text-primary)",
          }}
        >
          {t("home.ctaBand.title")}
        </h2>
        <p
          style={{
            marginTop: 12,
            color: "var(--text-secondary)",
            fontSize: 15,
            maxWidth: 600,
            marginInline: "auto",
            lineHeight: 1.55,
          }}
        >
          {t("home.ctaBand.sub")}
        </p>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link to="/tools/remove-watermark" className="btn-primary">
            {t("home.ctaBand.tryWatermark")}
          </Link>
          <Link to="/tools/remove-bg" className="btn-ghost">
            {t("home.ctaBand.tryBg")}
          </Link>
        </div>
      </section>
    </>
  );
}

function TrustPill({ icon, label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 999,
        background: "rgba(10, 11, 20, 0.04)",
        border: "1px solid var(--border)",
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

function SectionTitle({ eyebrow, title, sub }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 2.2,
          color: "var(--brand-pink)",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          marginTop: 10,
          fontSize: "clamp(28px, 4vw, 42px)",
          fontWeight: 800,
          letterSpacing: -1.4,
          color: "var(--text-primary)",
          lineHeight: 1.1,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            marginTop: 12,
            color: "var(--text-secondary)",
            fontSize: 15,
            maxWidth: 640,
            marginInline: "auto",
            lineHeight: 1.55,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function StepCard({ num, title, desc }) {
  return (
    <div
      style={{
        padding: "22px 20px",
        borderRadius: 16,
        background: "rgba(10, 11, 20, 0.03)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "var(--gradient-brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
          color: "#ffffff",
          marginBottom: 14,
          boxShadow: "0 6px 16px -4px rgba(168, 85, 247, 0.5)",
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: -0.2,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          lineHeight: 1.55,
        }}
      >
        {desc}
      </div>
    </div>
  );
}

function HeroFeature({ to, titleKey, descKey, ctaKey, gradient, accent, t, icon }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        display: "block",
        padding: "28px 26px",
        borderRadius: 20,
        background: gradient,
        border: `1px solid ${accent}55`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 24px 48px -20px ${accent}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: "rgba(0,0,0,0.35)",
          border: `1px solid ${accent}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: -0.5,
          marginBottom: 8,
        }}
      >
        {t(titleKey)}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.55,
          marginBottom: 18,
        }}
      >
        {t(descKey)}
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          padding: "6px 14px",
          borderRadius: 999,
          background: "rgba(10, 11, 20, 0.06)",
          border: "1px solid var(--border-strong)",
        }}
      >
        {t(ctaKey)} →
      </div>
    </Link>
  );
}

function DarkToolCard({ to, icon, accent, name, desc }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        display: "block",
        padding: "18px 18px 16px",
        borderRadius: 16,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-2px)";
        el.style.borderColor = `${accent}88`;
        el.style.boxShadow = `0 16px 32px -16px ${accent}88`;
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
          width: 42,
          height: 42,
          borderRadius: 11,
          background: `${accent}1f`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          border: `1px solid ${accent}33`,
        }}
      >
        <ToolIcon name={icon} size={22} />
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: -0.2,
          marginBottom: 4,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--text-muted)",
          lineHeight: 1.5,
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
      width="18"
      height="18"
      viewBox="0 0 22 22"
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth="2"
      strokeLinecap="round"
      style={{
        position: "absolute",
        left: 18,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    >
      <circle cx="10" cy="10" r="6.5" />
      <path d="M15 15l5 5" />
    </svg>
  );
}
