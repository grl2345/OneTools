import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

// Standard photo sizes (width×height in pixels @ 300dpi common values).
// Chinese / US / visa formats — all printable at correct physical size.
const SIZES = [
  { id: "one_inch",     nameKey: "tools.idPhoto.size_1inch",     w: 295, h: 413 },
  { id: "two_inch",     nameKey: "tools.idPhoto.size_2inch",     w: 413, h: 579 },
  { id: "small_one",    nameKey: "tools.idPhoto.size_small1",    w: 260, h: 378 },
  { id: "big_one",      nameKey: "tools.idPhoto.size_big1",      w: 390, h: 567 },
  { id: "us_passport",  nameKey: "tools.idPhoto.size_us",        w: 600, h: 600 },
  { id: "visa_china",   nameKey: "tools.idPhoto.size_visa",      w: 390, h: 567 },
];

const COLORS = [
  { id: "white",     color: "#ffffff", labelKey: "tools.idPhoto.bg_white" },
  { id: "blue",      color: "#2463eb", labelKey: "tools.idPhoto.bg_blue"  },
  { id: "red",       color: "#dc2626", labelKey: "tools.idPhoto.bg_red"   },
  { id: "lightgray", color: "#d4d4d8", labelKey: "tools.idPhoto.bg_gray"  },
];

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

export default function IdPhoto() {
  const { t } = useTranslation();

  const [file, setFile] = useState(null);
  const [origUrl, setOrigUrl] = useState(null);
  const [cutoutBlob, setCutoutBlob] = useState(null);   // transparent PNG (person cut out)
  const [cutoutUrl, setCutoutUrl] = useState(null);
  const [stage, setStage] = useState(null);             // 'loading-model' | 'processing' | null
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [sizeId, setSizeId] = useState("one_inch");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [resultUrl, setResultUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);

  const inputRef = useRef(null);
  const canceledRef = useRef(false);

  const size = SIZES.find((s) => s.id === sizeId) || SIZES[0];

  useEffect(() => {
    return () => {
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
      if (origUrl) URL.revokeObjectURL(origUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
    // eslint-disable-next-line
  }, []);

  const resetAll = () => {
    canceledRef.current = true;
    if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
    if (origUrl) URL.revokeObjectURL(origUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setOrigUrl(null);
    setCutoutBlob(null); setCutoutUrl(null);
    setResultUrl(null); setResultBlob(null);
    setStage(null); setProgress(0); setError(null);
  };

  const handleFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError(t("tools.idPhoto.notImage"));
      return;
    }
    resetAll();
    canceledRef.current = false;
    setFile(f);
    setOrigUrl(URL.createObjectURL(f));
    setError(null);
    setStage("loading-model");

    try {
      const mod = await import("@imgly/background-removal");
      const removeBackground = mod.default || mod.removeBackground;
      if (typeof removeBackground !== "function")
        throw new Error("background-removal module failed to load");

      setStage("processing");
      setProgress(0);
      const blob = await removeBackground(f, {
        progress: (key, curr, total) => {
          if (canceledRef.current) return;
          if (String(key).startsWith("fetch:") || String(key).startsWith("download")) {
            setStage("loading-model");
          } else {
            setStage("processing");
          }
          if (total) setProgress(Math.round((curr / total) * 100));
        },
      });
      if (canceledRef.current) return;

      setCutoutBlob(blob);
      setCutoutUrl(URL.createObjectURL(blob));
      setProgress(100);
      setStage(null);
    } catch (e) {
      if (!canceledRef.current) {
        setError(e?.message || "Background removal failed");
        setStage(null);
      }
    }
  };

  // Whenever cutout, size or background changes, compose the result.
  useEffect(() => {
    if (!cutoutBlob) { setResultUrl(null); setResultBlob(null); return; }
    let revoked = false;
    (async () => {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = URL.createObjectURL(cutoutBlob);
      });

      const canvas = document.createElement("canvas");
      canvas.width = size.w;
      canvas.height = size.h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size.w, size.h);

      // Center + cover-fit person into the target, but preserve head+shoulders
      // framing by anchoring a bit above center (common for ID photos).
      const srcRatio = img.width / img.height;
      const dstRatio = size.w / size.h;
      let dw, dh;
      if (srcRatio > dstRatio) {
        dh = size.h * 1.02; // slight over-fill
        dw = dh * srcRatio;
      } else {
        dw = size.w * 1.02;
        dh = dw / srcRatio;
      }
      const dx = (size.w - dw) / 2;
      const dy = (size.h - dh) * 0.42;  // anchor head toward top
      ctx.drawImage(img, dx, dy, dw, dh);

      canvas.toBlob((blob) => {
        if (revoked || !blob) return;
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
      }, "image/png");
    })();
    return () => { revoked = true; };
    // eslint-disable-next-line
  }, [cutoutBlob, sizeId, bgColor]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `id-photo-${size.id}-${bgColor.replace("#", "")}.png`;
    a.click();
  };

  const panel = {
    background: "#ffffff", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", overflow: "hidden",
    boxShadow: "var(--shadow-md)",
  };
  const panelHeader = {
    padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)",
    fontWeight: 500, borderBottom: "1px solid var(--border-light)",
    background: "#fafbfc", display: "flex", justifyContent: "space-between",
    alignItems: "center", letterSpacing: -0.1,
  };

  return (
    <>
      <SEO
        title={t("tools.idPhoto.name")}
        description={t("tools.idPhoto.desc")}
        path="/tools/id-photo"
        structuredData={schema.softwareApp({
          name: "OneTools AI ID Photo",
          description: t("tools.idPhoto.desc"),
          url: "https://onetools.dev/tools/id-photo",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
              {t("tools.idPhoto.name")}
              <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {" "}·AI
              </span>
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
              {t("tools.idPhoto.desc")}
            </p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 999,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)",
            color: "var(--green)", fontSize: 11.5, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            {t("tools.idPhoto.badge")}
          </span>
        </div>

        <input ref={inputRef} type="file" accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={{ display: "none" }} />

        {!file ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            style={{
              marginTop: 28, padding: "80px 24px", textAlign: "center",
              borderRadius: "var(--radius)",
              border: `2px dashed ${dragging ? "var(--brand)" : "var(--border-strong)"}`,
              background: dragging ? "rgba(91,91,245,0.06)" : "#ffffff",
              cursor: "pointer", boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {t("tools.idPhoto.dropHere")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.idPhoto.modelHint")}
            </div>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div style={{
              padding: "24px 0 14px", display: "flex", gap: 18,
              flexWrap: "wrap", alignItems: "center",
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 2 }}>
                  {t("tools.idPhoto.size")}:
                </span>
                {SIZES.map((s) => (
                  <button key={s.id} onClick={() => setSizeId(s.id)}
                    style={{
                      padding: "5px 10px", borderRadius: 999,
                      border: sizeId === s.id ? "1px solid var(--text-primary)" : "1px solid var(--border)",
                      background: sizeId === s.id ? "var(--text-primary)" : "#ffffff",
                      color: sizeId === s.id ? "#fff" : "var(--text-secondary)",
                      fontSize: 11.5, fontWeight: 500,
                    }}>
                    {t(s.nameKey)} <span style={{ opacity: 0.7, fontFamily: "var(--font-mono)", fontSize: 10 }}>{s.w}×{s.h}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 2 }}>
                  {t("tools.idPhoto.background")}:
                </span>
                {COLORS.map((c) => (
                  <button key={c.id} onClick={() => setBgColor(c.color)}
                    title={t(c.labelKey)}
                    style={{
                      width: 26, height: 26, borderRadius: 999,
                      border: bgColor === c.color ? "3px solid var(--text-primary)" : "1px solid var(--border)",
                      background: c.color, cursor: "pointer",
                    }} />
                ))}
                <input type="color" value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: 30, height: 26, border: "1px solid var(--border)", borderRadius: 6, padding: 0, background: "none", cursor: "pointer" }} />
              </div>

              <div style={{ flex: 1 }} />
              <button onClick={resetAll}
                style={{
                  padding: "8px 16px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)", background: "#ffffff",
                  color: "var(--text-primary)", fontSize: 13, fontWeight: 500,
                }}>
                {t("tools.idPhoto.reset")}
              </button>
              <button onClick={handleDownload} disabled={!resultBlob}
                style={{
                  padding: "8px 18px", borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: resultBlob ? "var(--text-primary)" : "#d8d8e0",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  boxShadow: resultBlob ? "0 4px 14px rgba(10,11,16,0.2)" : "none",
                }}>
                ⬇ {t("tools.idPhoto.download")}
              </button>
            </div>

            {/* Preview */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingBottom: 20 }}>
              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.idPhoto.original")}</span>
                  <span style={{ color: "var(--text-faint)" }}>{formatSize(file.size)}</span>
                </div>
                <div style={{
                  padding: 16, minHeight: 360,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "repeating-conic-gradient(#f3f4f7 0 25%, #ffffff 0 50%) 0 0 / 20px 20px",
                }}>
                  <img src={origUrl} alt="" style={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain" }} />
                </div>
              </div>
              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.idPhoto.result")}</span>
                  <span style={{ color: "var(--text-faint)" }}>
                    {resultBlob ? `${size.w}×${size.h} · ${formatSize(resultBlob.size)}` : "—"}
                  </span>
                </div>
                <div style={{
                  padding: 16, minHeight: 360,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#f3f4f7",
                }}>
                  {resultUrl ? (
                    <img src={resultUrl} alt="" style={{ maxHeight: 420, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }} />
                  ) : stage ? (
                    <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, color: "var(--brand)", marginBottom: 10 }}>
                        {stage === "loading-model" ? t("tools.idPhoto.loadingModel") : t("tools.idPhoto.processing")}
                      </div>
                      <div style={{ width: 200, height: 6, margin: "0 auto", background: "rgba(91,91,245,0.12)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progress || 3}%`, background: "var(--gradient-brand)", transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
                        {progress}%
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{
            marginBottom: 30, padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "var(--red)", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {!file && (
          <div style={{
            marginTop: 16, marginBottom: 72, padding: "16px 18px",
            borderRadius: "var(--radius)",
            background: "rgba(91,91,245,0.05)",
            border: "1px solid rgba(91,91,245,0.18)",
            fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 600, color: "var(--brand)", marginBottom: 4 }}>
              ℹ︎ {t("tools.idPhoto.privacyTitle")}
            </div>
            {t("tools.idPhoto.privacyDesc")}
          </div>
        )}
      </div>
    </>
  );
}
