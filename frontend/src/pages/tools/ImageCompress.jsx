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

const OUTPUT_FORMATS = [
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/png", label: "PNG" },
];

async function compressImage(file, { quality, maxWidth, format }) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const max = maxWidth ? Number(maxWidth) : 0;
  if (max && Math.max(width, height) > max) {
    const scale = max / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (format === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("encode failed"))),
      format,
      quality
    );
  });

  const resultUrl = URL.createObjectURL(blob);
  return { blob, url: resultUrl, width, height, originalUrl: dataUrl };
}

export default function ImageCompress() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState("");
  const [format, setFormat] = useState("image/jpeg");
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    let canceled = false;
    setProcessing(true);
    setError(null);
    compressImage(file, { quality, maxWidth, format })
      .then((r) => {
        if (!canceled) setResult(r);
      })
      .catch((e) => {
        if (!canceled) setError(e.message || "Failed to compress");
      })
      .finally(() => {
        if (!canceled) setProcessing(false);
      });
    return () => {
      canceled = true;
    };
  }, [file, quality, maxWidth, format]);

  const openPicker = () => inputRef.current?.click();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Not an image file");
      return;
    }
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleDownload = () => {
    if (!result) return;
    const ext = format.split("/")[1];
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${base}.min.${ext}`;
    a.click();
  };

  const reset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
    setError(null);
  };

  const ratio = result && file
    ? Math.round((1 - result.blob.size / file.size) * 100)
    : 0;

  const btn = (active) => ({
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: active ? "var(--text-primary)" : "#ffffff",
    color: active ? "#fff" : "var(--text-secondary)",
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: -0.1,
    transition: "all 0.15s ease",
  });

  const panel = {
    background: "#ffffff",
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
    background: "#fafbfc",
    letterSpacing: -0.1,
  };

  return (
    <>
      <SEO
        title={t("tools.imageCompress.name")}
        description={t("tools.imageCompress.desc")}
        path="/tools/image-compress"
        structuredData={schema.softwareApp({
          name: "OneTools Image Compress",
          description: t("tools.imageCompress.desc"),
          url: "https://onetools.dev/tools/image-compress",
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
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: -1.4,
              lineHeight: 1.08,
              color: "var(--text-primary)",
            }}
          >
            {t("tools.imageCompress.name")}
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {" "}·JPG/WebP
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
            {t("tools.imageCompress.desc")}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          padding: "28px 0 14px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <label style={labelStyle}>
            {t("tools.imageCompress.quality")}{" "}
            <span style={{ color: "var(--brand)", fontWeight: 600 }}>
              {Math.round(quality * 100)}%
            </span>
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            disabled={!file || format === "image/png"}
            style={{ width: "100%", accentColor: "var(--brand)" }}
          />
        </div>

        <div>
          <label style={labelStyle}>{t("tools.imageCompress.maxWidth")}</label>
          <input
            type="number"
            placeholder={t("tools.imageCompress.original")}
            value={maxWidth}
            onChange={(e) => setMaxWidth(e.target.value.replace(/\D/g, ""))}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>{t("tools.imageCompress.format")}</label>
          <div style={{ display: "flex", gap: 4 }}>
            {OUTPUT_FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                style={{ ...btn(format === f.value), flex: 1 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={file ? reset : openPicker}
          style={{
            padding: "10px 18px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: file ? "#ffffff" : "var(--gradient-brand)",
            color: file ? "var(--text-primary)" : "#fff",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: -0.1,
            boxShadow: file
              ? "inset 0 0 0 1px var(--border-strong)"
              : "0 4px 14px rgba(91,91,245,0.35)",
          }}
        >
          {file
            ? t("tools.imageCompress.reset")
            : t("tools.imageCompress.choose")}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: "none" }}
      />

      {/* Drop / Preview area */}
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
            marginTop: 8,
            padding: "80px 24px",
            textAlign: "center",
            borderRadius: "var(--radius)",
            border: `2px dashed ${dragging ? "var(--brand)" : "var(--border-strong)"}`,
            background: dragging ? "rgba(91,91,245,0.06)" : "#ffffff",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 4,
              letterSpacing: -0.2,
            }}
          >
            {t("tools.imageCompress.dropHere")}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {t("tools.imageCompress.or")}{" "}
            <span style={{ color: "var(--brand)", fontWeight: 500 }}>
              {t("tools.imageCompress.browse")}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            paddingBottom: 20,
          }}
        >
          {/* Original */}
          <div style={panel}>
            <div style={panelHeader}>
              <span>{t("tools.imageCompress.original")}</span>
              <span style={{ color: "var(--text-faint)" }}>
                {formatSize(file.size)}
              </span>
            </div>
            <div style={previewBox}>
              <img
                src={result?.originalUrl || ""}
                alt=""
                style={imgStyle}
              />
            </div>
          </div>

          {/* Compressed */}
          <div style={panel}>
            <div style={panelHeader}>
              <span>{t("tools.imageCompress.compressed")}</span>
              <span style={{ color: "var(--text-faint)" }}>
                {result
                  ? `${formatSize(result.blob.size)} · ${
                      result.width
                    }×${result.height}`
                  : processing
                  ? t("tools.imageCompress.processing")
                  : "—"}
              </span>
            </div>
            <div style={previewBox}>
              {result ? (
                <img src={result.url} alt="" style={imgStyle} />
              ) : (
                <div style={{ color: "var(--text-faint)", fontSize: 13 }}>
                  {processing ? "…" : "—"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result summary + download */}
      {result && file && (
        <div
          style={{
            marginBottom: 60,
            padding: "14px 18px",
            borderRadius: "var(--radius)",
            background:
              ratio >= 0
                ? "rgba(16,185,129,0.08)"
                : "rgba(245,158,11,0.08)",
            border: `1px solid ${
              ratio >= 0 ? "rgba(16,185,129,0.22)" : "rgba(245,158,11,0.22)"
            }`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: ratio >= 0 ? "var(--green)" : "var(--amber)",
                letterSpacing: -0.1,
              }}
            >
              {ratio >= 0
                ? t("tools.imageCompress.saved", { percent: ratio })
                : t("tools.imageCompress.larger", { percent: -ratio })}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--text-secondary)",
                marginTop: 2,
              }}
            >
              {formatSize(file.size)} → {formatSize(result.blob.size)}
            </div>
          </div>
          <button
            onClick={handleDownload}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              background: "var(--text-primary)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: -0.1,
              boxShadow: "0 4px 14px rgba(10,11,16,0.2)",
            }}
          >
            ⬇ {t("tools.imageCompress.download")}
          </button>
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
    </div>
    </>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: 6,
  letterSpacing: -0.1,
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "#ffffff",
  fontSize: 13,
  fontFamily: "var(--font-mono)",
  color: "var(--text-primary)",
  outline: "none",
};

const previewBox = {
  padding: 16,
  minHeight: 280,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "repeating-conic-gradient(#f3f4f7 0 25%, #ffffff 0 50%) 0 0 / 20px 20px",
};

const imgStyle = {
  maxWidth: "100%",
  maxHeight: 360,
  objectFit: "contain",
  borderRadius: 6,
};
