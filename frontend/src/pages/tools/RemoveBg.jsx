import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

export default function RemoveBg() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [outBlob, setOutBlob] = useState(null);
  const [outUrl, setOutUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(null); // 'loading-model' | 'processing' | null
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [bgColor, setBgColor] = useState("transparent");
  const inputRef = useRef(null);
  const canceledRef = useRef(false);

  const openPicker = () => inputRef.current?.click();

  const resetAll = () => {
    canceledRef.current = true;
    if (outUrl) URL.revokeObjectURL(outUrl);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setFile(null);
    setOriginalUrl(null);
    setOutBlob(null);
    setOutUrl(null);
    setProgress(0);
    setStage(null);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (outUrl) URL.revokeObjectURL(outUrl);
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
    // eslint-disable-next-line
  }, []);

  // Pick up file passed from Home page
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("onetools:pendingImage");
      if (!raw) return;
      const { name, type, dataUrl } = JSON.parse(raw);
      sessionStorage.removeItem("onetools:pendingImage");
      fetch(dataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const f = new File([blob], name || "pending.png", {
            type: type || "image/png",
          });
          handleFile(f);
        })
        .catch(() => {});
    } catch {}
    // eslint-disable-next-line
  }, []);

  const handleFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Not an image file");
      return;
    }
    resetAll();
    canceledRef.current = false;
    setFile(f);
    const origUrl = URL.createObjectURL(f);
    setOriginalUrl(origUrl);
    setError(null);
    setStage("loading-model");

    try {
      // Dynamic import keeps the ~60 MB WASM out of the initial bundle
      const mod = await import("@imgly/background-removal");
      const removeBackground = mod.default || mod.removeBackground;
      if (typeof removeBackground !== "function") {
        throw new Error("background-removal module failed to load");
      }

      setStage("processing");
      setProgress(0);

      const blob = await removeBackground(f, {
        progress: (key, current, total) => {
          if (canceledRef.current) return;
          if (key?.startsWith("fetch:") || key?.startsWith("download")) {
            setStage("loading-model");
          } else {
            setStage("processing");
          }
          if (total) setProgress(Math.round((current / total) * 100));
        },
      });

      if (canceledRef.current) return;

      setOutBlob(blob);
      setOutUrl(URL.createObjectURL(blob));
      setProgress(100);
      setStage(null);
    } catch (e) {
      if (!canceledRef.current) {
        setError(e?.message || "Background removal failed");
        setStage(null);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleDownload = () => {
    if (!outBlob) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = outUrl;
    a.download = `${base}.nobg.png`;
    a.click();
  };

  const panel = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
  };

  const panelHeader = {
    padding: "10px 14px",
    fontSize: 12,
    color: "var(--text-secondary)",
    fontWeight: 500,
    borderBottom: "1px solid var(--border-light)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(10, 11, 20, 0.02)",
    letterSpacing: -0.1,
  };

  const bgChoices = [
    { value: "transparent", label: t("tools.removeBg.bgTransparent") },
    { value: "#ffffff", label: "White" },
    { value: "#000000", label: "Black" },
    { value: "#a855f7", label: "Brand" },
  ];

  const previewBg =
    bgColor === "transparent"
      ? "repeating-conic-gradient(rgba(255,255,255,0.02) 0 25%, rgba(255,255,255,0.06) 0 50%) 0 0 / 20px 20px"
      : bgColor;

  return (
    <>
      <SEO
        title={t("tools.removeBg.name")}
        description={t("tools.removeBg.desc")}
        path="/tools/remove-bg"
        structuredData={schema.softwareApp({
          name: "OneTools AI Remove Background",
          description: t("tools.removeBg.desc"),
          url: "https://onetools.dev/tools/remove-bg",
        })}
      />
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
      {/* Header */}
      <div
        style={{
          padding: "56px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: -1.6,
              lineHeight: 1.05,
              color: "var(--text-primary)",
            }}
          >
            {t("tools.removeBg.name")}
            <span className="gradient-text" style={{ fontStyle: "italic" }}>
              {" "}AI
            </span>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginTop: 8,
              fontWeight: 450,
              letterSpacing: -0.15,
            }}
          >
            {t("tools.removeBg.desc")}
          </p>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 999,
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.22)",
            color: "var(--green)",
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: -0.1,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
            }}
          />
          {t("tools.removeBg.badge")}
        </span>
      </div>

      {/* Controls */}
      {file && (
        <div
          style={{
            padding: "28px 0 14px",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginRight: 4,
              }}
            >
              {t("tools.removeBg.background")}:
            </span>
            {bgChoices.map((c) => (
              <button
                key={c.value}
                onClick={() => setBgColor(c.value)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  border:
                    bgColor === c.value
                      ? "1px solid transparent"
                      : "1px solid var(--border)",
                  background:
                    bgColor === c.value
                      ? "var(--gradient-brand)"
                      : "rgba(10, 11, 20, 0.04)",
                  color:
                    bgColor === c.value ? "#fff" : "var(--text-secondary)",
                  fontSize: 11.5,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {c.value !== "transparent" && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: c.value,
                      border: "1px solid var(--border)",
                    }}
                  />
                )}
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={resetAll}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                background: "rgba(10, 11, 20, 0.04)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {t("tools.removeBg.reset")}
            </button>
            <button
              onClick={handleDownload}
              disabled={!outBlob}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: outBlob ? "var(--gradient-brand)" : "rgba(10, 11, 20, 0.08)",
                color: outBlob ? "#fff" : "var(--text-faint)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: -0.1,
                boxShadow: outBlob ? "var(--shadow-brand)" : "none",
              }}
            >
              ⬇ {t("tools.removeBg.download")}
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: "none" }}
      />

      {!file ? (
        <div
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            marginTop: 28,
            padding: "80px 24px",
            textAlign: "center",
            borderRadius: "var(--radius)",
            border: `2px dashed ${dragging ? "var(--brand-pink)" : "rgba(168,85,247,0.4)"}`,
            background: dragging ? "rgba(236,72,153,0.08)" : "var(--bg-card)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 20px 50px -20px rgba(168, 85, 247, 0.3)",
          }}
        >
          <div style={{ fontSize: 34, marginBottom: 12 }}>✂️</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 4,
              letterSpacing: -0.2,
            }}
          >
            {t("tools.removeBg.dropHere")}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {t("tools.removeBg.modelHint")}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            paddingBottom: 20,
            marginTop: 0,
          }}
        >
          <div style={panel}>
            <div style={panelHeader}>
              <span>{t("tools.removeBg.original")}</span>
              <span style={{ color: "var(--text-faint)" }}>
                {formatSize(file.size)}
              </span>
            </div>
            <div
              style={{
                padding: 16,
                minHeight: 360,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "repeating-conic-gradient(rgba(255,255,255,0.02) 0 25%, rgba(255,255,255,0.06) 0 50%) 0 0 / 20px 20px",
              }}
            >
              <img
                src={originalUrl}
                alt=""
                style={{
                  maxWidth: "100%",
                  maxHeight: 420,
                  objectFit: "contain",
                  borderRadius: 6,
                }}
              />
            </div>
          </div>

          <div style={panel}>
            <div style={panelHeader}>
              <span>{t("tools.removeBg.result")}</span>
              <span style={{ color: "var(--text-faint)" }}>
                {outBlob ? formatSize(outBlob.size) : "—"}
              </span>
            </div>
            <div
              style={{
                padding: 16,
                minHeight: 360,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: previewBg,
                position: "relative",
              }}
            >
              {outUrl ? (
                <img
                  src={outUrl}
                  alt=""
                  style={{
                    maxWidth: "100%",
                    maxHeight: 420,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--brand)",
                      marginBottom: 12,
                    }}
                  >
                    {stage === "loading-model"
                      ? t("tools.removeBg.loadingModel")
                      : t("tools.removeBg.processing")}
                  </div>
                  <div
                    style={{
                      width: 200,
                      height: 6,
                      margin: "0 auto",
                      background: "rgba(168,85,247,0.2)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress || 3}%`,
                        background: "var(--gradient-brand)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 8,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {progress}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 30,
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "var(--red)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {!file && (
        <div
          style={{
            marginTop: 20,
            padding: "16px 18px",
            borderRadius: "var(--radius)",
            background: "rgba(168,85,247,0.08)",
            border: "1px solid rgba(168,85,247,0.25)",
            fontSize: 12.5,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 72,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "var(--brand)",
              marginBottom: 4,
            }}
          >
            ℹ︎ {t("tools.removeBg.privacyTitle")}
          </div>
          {t("tools.removeBg.privacyDesc")}
        </div>
      )}
    </div>
    </>
  );
}
