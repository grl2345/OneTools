import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

// Super-resolution models (ONNX, hosted on HF by Xenova).
// Swin2SR is the current SOTA for lightweight in-browser upscaling.
const MODELS = [
  { id: "Xenova/swin2SR-classical-sr-x2-64", factor: 2, sizeMb: 60,  labelKey: "tools.upscale.model_x2" },
  { id: "Xenova/swin2SR-classical-sr-x4-64", factor: 4, sizeMb: 60,  labelKey: "tools.upscale.model_x4" },
  { id: "Xenova/swin2SR-lightweight-x2-64",  factor: 2, sizeMb: 30,  labelKey: "tools.upscale.model_light" },
];

let cachedPipeline = null;
let cachedModelId = null;

async function getUpscaler(modelId, onProgress) {
  if (cachedPipeline && cachedModelId === modelId) return cachedPipeline;
  const { pipeline, env } = await import("@xenova/transformers");
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  cachedPipeline = await pipeline("image-to-image", modelId, {
    progress_callback: (data) => {
      if (data.status === "progress" && data.total) {
        onProgress?.({
          stage: "download",
          file: data.file,
          pct: Math.round((data.loaded / data.total) * 100),
        });
      } else if (data.status === "ready") {
        onProgress?.({ stage: "ready" });
      }
    },
  });
  cachedModelId = modelId;
  return cachedPipeline;
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`;
}

export default function Upscale() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [inputUrl, setInputUrl] = useState(null);
  const [inputDims, setInputDims] = useState(null); // { w, h }
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [stage, setStage] = useState(null);          // 'load' | 'run' | null
  const [progress, setProgress] = useState(0);
  const [progressFile, setProgressFile] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultDims, setResultDims] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState("after"); // 'before' | 'after'
  const inputRef = useRef(null);

  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];

  const reset = () => {
    if (inputUrl) URL.revokeObjectURL(inputUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setInputUrl(null); setInputDims(null);
    setResultBlob(null); setResultUrl(null); setResultDims(null);
    setError(null); setStage(null); setProgress(0);
  };

  const handleFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError(t("tools.upscale.notImage")); return; }
    reset();
    setError(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setInputUrl(url);
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    setInputDims({ w: img.width, h: img.height });
    if (img.width > 1024 || img.height > 1024) {
      setError(t("tools.upscale.tooBig"));
    }
  };

  const run = async () => {
    if (!file || stage) return;
    setError(null); setResultBlob(null); setResultUrl(null);
    try {
      setStage("load");
      setProgress(0);
      const up = await getUpscaler(modelId, (p) => {
        if (p.stage === "download") {
          setProgressFile(p.file);
          setProgress(p.pct);
        }
      });

      setStage("run");
      setProgress(0);
      // Read input into a data URL for transformers.js
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      const output = await up(dataUrl);
      // Output is a RawImage; convert to canvas -> blob
      const canvas = document.createElement("canvas");
      canvas.width = output.width;
      canvas.height = output.height;
      const ctx = canvas.getContext("2d");
      const imgData = new ImageData(
        new Uint8ClampedArray(output.data.buffer || output.data),
        output.width,
        output.height
      );
      // RawImage might be RGB (3 channels) — pad to RGBA
      if (imgData.data.length !== output.width * output.height * 4) {
        const rgba = new Uint8ClampedArray(output.width * output.height * 4);
        const src = output.data;
        const channels = src.length / (output.width * output.height);
        for (let i = 0; i < output.width * output.height; i++) {
          rgba[i * 4]     = src[i * channels];
          rgba[i * 4 + 1] = src[i * channels + 1] ?? src[i * channels];
          rgba[i * 4 + 2] = src[i * channels + 2] ?? src[i * channels];
          rgba[i * 4 + 3] = 255;
        }
        ctx.putImageData(new ImageData(rgba, output.width, output.height), 0, 0);
      } else {
        ctx.putImageData(imgData, 0, 0);
      }

      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setResultDims({ w: output.width, h: output.height });
      setStage(null);
    } catch (e) {
      setError(e?.message || "Upscale failed");
      setStage(null);
    }
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${base}.x${model.factor}.png`;
    a.click();
  };

  const panel = { background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "#fafbfc", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  return (
    <>
      <SEO
        title={t("tools.upscale.name")}
        description={t("tools.upscale.desc")}
        path="/tools/upscale"
        structuredData={schema.softwareApp({
          name: "OneTools AI Upscale",
          description: t("tools.upscale.desc"),
          url: "https://onetools.dev/tools/upscale",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
              {t("tools.upscale.name")}
              <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · Swin2SR</span>
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
              {t("tools.upscale.desc")}
            </p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 999,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)",
            color: "var(--green)", fontSize: 11.5, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            {t("tools.upscale.badge")}
          </span>
        </div>

        <input ref={inputRef} type="file" accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

        <div style={{ padding: "24px 0 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("tools.upscale.modelLabel")}:</span>
          {MODELS.map((m) => (
            <button key={m.id} onClick={() => setModelId(m.id)} disabled={!!stage}
              style={{
                padding: "5px 12px", borderRadius: 999,
                border: modelId === m.id ? "1px solid var(--text-primary)" : "1px solid var(--border)",
                background: modelId === m.id ? "var(--text-primary)" : "#ffffff",
                color: modelId === m.id ? "#fff" : "var(--text-secondary)",
                fontSize: 11.5, fontWeight: 500,
                cursor: stage ? "not-allowed" : "pointer",
              }}>
              {t(m.labelKey)} <span style={{ opacity: 0.7, fontFamily: "var(--font-mono)", fontSize: 10 }}>{m.sizeMb} MB · {m.factor}x</span>
            </button>
          ))}
        </div>

        {!file ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            style={{
              padding: "80px 24px", textAlign: "center",
              borderRadius: "var(--radius)",
              border: `2px dashed ${dragging ? "var(--brand)" : "var(--border-strong)"}`,
              background: dragging ? "rgba(91,91,245,0.06)" : "#ffffff",
              cursor: "pointer", boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔎</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {t("tools.upscale.dropHere")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.upscale.hint")}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                  {inputDims && `${inputDims.w}×${inputDims.h}`} · {formatSize(file.size)}
                  {resultDims && ` → ${resultDims.w}×${resultDims.h}`}
                  {resultBlob && ` · ${formatSize(resultBlob.size)}`}
                </div>
              </div>
              {resultUrl && (
                <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--bg-subtle)", borderRadius: 999 }}>
                  <button onClick={() => setView("before")}
                    style={{
                      padding: "4px 12px", borderRadius: 999, border: "none",
                      background: view === "before" ? "var(--text-primary)" : "transparent",
                      color: view === "before" ? "#fff" : "var(--text-secondary)",
                      fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                    }}>
                    {t("tools.upscale.before")}
                  </button>
                  <button onClick={() => setView("after")}
                    style={{
                      padding: "4px 12px", borderRadius: 999, border: "none",
                      background: view === "after" ? "var(--text-primary)" : "transparent",
                      color: view === "after" ? "#fff" : "var(--text-secondary)",
                      fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                    }}>
                    {t("tools.upscale.after")}
                  </button>
                </div>
              )}
              <button onClick={reset}
                style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "#ffffff", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                {t("tools.upscale.replace")}
              </button>
              <button onClick={run} disabled={!!stage}
                style={{
                  padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none",
                  background: stage ? "#d8d8e0" : "var(--gradient-brand)",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: stage ? "wait" : "pointer",
                  boxShadow: stage ? "none" : "0 4px 14px rgba(91,91,245,0.35)",
                }}>
                {stage === "load" ? t("tools.upscale.loading") :
                 stage === "run" ? t("tools.upscale.running") :
                 "✦ " + t("tools.upscale.upscale")}
              </button>
              <button onClick={download} disabled={!resultBlob}
                style={{ padding: "8px 18px", borderRadius: "var(--radius-sm)", border: "none", background: resultBlob ? "var(--text-primary)" : "#d8d8e0", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: resultBlob ? "0 4px 14px rgba(10,11,16,0.2)" : "none" }}>
                ⬇ {t("tools.upscale.download")}
              </button>
            </div>

            {stage && (
              <div style={{
                marginBottom: 14, padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(91,91,245,0.05)",
                border: "1px solid rgba(91,91,245,0.18)",
              }}>
                <div style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                  {stage === "load" ? t("tools.upscale.loadingModel", { size: model.sizeMb }) : t("tools.upscale.running")}
                  {stage === "load" && progressFile && (
                    <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", textTransform: "none", letterSpacing: 0 }}>
                      {progressFile}
                    </span>
                  )}
                </div>
                {stage === "load" ? (
                  <div style={{ height: 5, background: "rgba(91,91,245,0.15)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress || 3}%`, background: "var(--gradient-brand)", transition: "width 0.3s" }} />
                  </div>
                ) : (
                  <div style={{
                    height: 5, background: "rgba(91,91,245,0.15)",
                    borderRadius: 999, overflow: "hidden", position: "relative",
                  }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(91,91,245,0.5), transparent)", animation: "shimmer 1.6s ease infinite", backgroundSize: "200% 100%" }} />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div style={panel}>
              <div style={panelHeader}>
                <span>{view === "before" ? t("tools.upscale.original") : t("tools.upscale.upscaled")}</span>
                <span style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  {view === "before" && inputDims && `${inputDims.w}×${inputDims.h}`}
                  {view === "after" && resultDims && `${resultDims.w}×${resultDims.h}`}
                </span>
              </div>
              <div style={{ padding: 16, minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", background: "repeating-conic-gradient(#f3f4f7 0 25%, #ffffff 0 50%) 0 0 / 20px 20px", overflow: "auto" }}>
                <img
                  src={view === "before" ? inputUrl : (resultUrl || inputUrl)}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: 600, objectFit: "contain", imageRendering: view === "before" ? "pixelated" : "auto" }}
                />
              </div>
            </div>
          </>
        )}

        {!file && (
          <div style={{
            marginTop: 20, marginBottom: 72, padding: "16px 18px",
            borderRadius: "var(--radius)",
            background: "rgba(91,91,245,0.05)",
            border: "1px solid rgba(91,91,245,0.18)",
            fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 600, color: "var(--brand)", marginBottom: 4 }}>
              ℹ︎ {t("tools.upscale.privacyTitle")}
            </div>
            {t("tools.upscale.privacyDesc")}
          </div>
        )}
      </div>
    </>
  );
}
