import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";
import FaqSection from "../../components/FaqSection";

// ── LaMa ONNX model hosted on Hugging Face (free, permissive CORS) ──
const MODEL_URL =
  "https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx";
const MODEL_SIZE = 512; // LaMa requires dims divisible by 8; 512 is a good default

// Use onnxruntime-web 1.17.3 via <script> tag (not npm import).
//
// Why script tag instead of `import('onnxruntime-web')`?
// The npm import approach was intermittently throwing
// "t.getValue is not a function" — a known issue where the JS bundle
// built by Vite doesn't match the WASM sidecar the runtime downloads
// separately. Loading the pre-built UMD bundle directly from jsDelivr
// guarantees the JS and its WASM helpers are byte-identical matches.
//
// 1.17.3 is the last pre-JSEP release and rock solid for WASM-only use.
const ORT_VERSION = "1.17.3";
const ORT_CDN = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist`;

let ortPromise = null;
let sessionCache = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Reuse an already-loaded script if one exists
    if (document.querySelector(`script[data-ort="${ORT_VERSION}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.ort = ORT_VERSION;
    s.onload = () => resolve();
    s.onerror = () =>
      reject(new Error("Failed to load onnxruntime-web from CDN"));
    document.head.appendChild(s);
  });
}

async function getORT() {
  if (window.ort) return window.ort;
  if (!ortPromise) {
    ortPromise = loadScript(`${ORT_CDN}/ort.min.js`).then(() => {
      const ort = window.ort;
      if (!ort) throw new Error("window.ort missing after script load");
      // Match WASM sidecar files to the same version and directory
      ort.env.wasm.wasmPaths = `${ORT_CDN}/`;
      // Single-thread + no proxy — works everywhere, including Vercel
      // deployments without COOP/COEP headers.
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = false;
      ort.env.wasm.simd = true;
      return ort;
    });
  }
  return ortPromise;
}

async function getSession(onProgress) {
  if (sessionCache) return sessionCache;
  const ort = await getORT();

  const resp = await fetch(MODEL_URL);
  if (!resp.ok) throw new Error(`Model fetch failed: HTTP ${resp.status}`);

  // Stream the download so we can report progress, then collect into a single
  // ArrayBuffer for InferenceSession.create (Blob->arrayBuffer is robust).
  const reader = resp.body.getReader();
  const total = Number(resp.headers.get("Content-Length")) || 0;
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (total) onProgress?.(loaded / total);
  }
  const modelBuf = await new Blob(chunks).arrayBuffer();

  sessionCache = await ort.InferenceSession.create(modelBuf, {
    executionProviders: ["wasm"],
  });
  if (typeof console !== "undefined") {
    console.log(
      "[RemoveWatermark] ORT session ready:",
      "inputs=",
      sessionCache.inputNames,
      "outputs=",
      sessionCache.outputNames
    );
  }
  return sessionCache;
}

// ── Tensor preprocessing / postprocessing ──
async function runInpaint(origImage, maskCanvas) {
  const ort = await getORT();
  const session = sessionCache;
  if (!session) throw new Error("Session not loaded");

  // 1. Resize both image & mask to MODEL_SIZE x MODEL_SIZE
  const imgCan = document.createElement("canvas");
  imgCan.width = MODEL_SIZE;
  imgCan.height = MODEL_SIZE;
  imgCan
    .getContext("2d")
    .drawImage(origImage, 0, 0, MODEL_SIZE, MODEL_SIZE);
  const imgData = imgCan
    .getContext("2d")
    .getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);

  const maskCan = document.createElement("canvas");
  maskCan.width = MODEL_SIZE;
  maskCan.height = MODEL_SIZE;
  maskCan
    .getContext("2d")
    .drawImage(maskCanvas, 0, 0, MODEL_SIZE, MODEL_SIZE);
  const maskData = maskCan
    .getContext("2d")
    .getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);

  // 2. Build float32 tensors in CHW layout
  const HW = MODEL_SIZE * MODEL_SIZE;
  const imgTensor = new Float32Array(3 * HW);
  const maskTensor = new Float32Array(HW);
  for (let i = 0; i < HW; i++) {
    imgTensor[i] = imgData.data[i * 4] / 255;
    imgTensor[HW + i] = imgData.data[i * 4 + 1] / 255;
    imgTensor[2 * HW + i] = imgData.data[i * 4 + 2] / 255;
    maskTensor[i] = maskData.data[i * 4 + 3] > 32 ? 1 : 0;
  }

  // 3. Run inference — map by input NAMES (image/mask), not array order,
  //    so the feeds survive any reshuffling in future model versions.
  const imageTensor = new ort.Tensor(
    "float32",
    imgTensor,
    [1, 3, MODEL_SIZE, MODEL_SIZE]
  );
  const maskTensorObj = new ort.Tensor(
    "float32",
    maskTensor,
    [1, 1, MODEL_SIZE, MODEL_SIZE]
  );

  const feeds = {};
  for (const name of session.inputNames) {
    const lower = name.toLowerCase();
    if (lower.includes("mask")) {
      feeds[name] = maskTensorObj;
    } else {
      feeds[name] = imageTensor;
    }
  }
  // Safety: if the loop didn't fill both, fall back to positional.
  if (Object.keys(feeds).length < session.inputNames.length) {
    feeds[session.inputNames[0]] = imageTensor;
    feeds[session.inputNames[1]] = maskTensorObj;
  }
  const results = await session.run(feeds);
  const outTensor = results[session.outputNames[0]];
  const out = outTensor.data;
  const dims = outTensor.dims || [];

  // Diagnose output: dims + value range
  let minV = Infinity;
  let maxV = -Infinity;
  const sample = Math.min(out.length, 4096);
  for (let i = 0; i < sample; i++) {
    if (out[i] < minV) minV = out[i];
    if (out[i] > maxV) maxV = out[i];
  }
  console.log(
    "[RemoveWatermark] output dims:",
    dims,
    "range:",
    minV,
    "→",
    maxV
  );

  // Auto-detect layout: NCHW = [B, 3, H, W] · NHWC = [B, H, W, 3]
  let isNHWC = false;
  if (dims.length === 4) {
    if (dims[3] === 3 && dims[1] !== 3) isNHWC = true;
  } else if (dims.length === 3) {
    if (dims[2] === 3 && dims[0] !== 3) isNHWC = true;
  }

  // Auto-detect value range
  let mul = 255;
  let add = 0;
  if (maxV > 2.5) {
    mul = 1;
    add = 0;
  } else if (minV < -0.2) {
    mul = 127.5;
    add = 127.5;
  }

  // 4. Write back to canvas
  const outImg = imgCan.getContext("2d").createImageData(MODEL_SIZE, MODEL_SIZE);
  if (isNHWC) {
    for (let i = 0; i < HW; i++) {
      outImg.data[i * 4] = clamp255(out[i * 3] * mul + add);
      outImg.data[i * 4 + 1] = clamp255(out[i * 3 + 1] * mul + add);
      outImg.data[i * 4 + 2] = clamp255(out[i * 3 + 2] * mul + add);
      outImg.data[i * 4 + 3] = 255;
    }
  } else {
    for (let i = 0; i < HW; i++) {
      outImg.data[i * 4] = clamp255(out[i] * mul + add);
      outImg.data[i * 4 + 1] = clamp255(out[HW + i] * mul + add);
      outImg.data[i * 4 + 2] = clamp255(out[2 * HW + i] * mul + add);
      outImg.data[i * 4 + 3] = 255;
    }
  }
  imgCan.getContext("2d").putImageData(outImg, 0, 0);
  return imgCan; // 512×512 inpainted canvas
}

function clamp255(x) {
  return Math.max(0, Math.min(255, Math.round(x)));
}

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

export default function RemoveWatermark() {
  const { t } = useTranslation();

  const [file, setFile] = useState(null);
  const [origImg, setOrigImg] = useState(null);
  const [resultCanvas, setResultCanvas] = useState(null);
  const [brushSize, setBrushSize] = useState(30);
  const [stage, setStage] = useState(null); // 'loading-model' | 'processing' | null
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("edit"); // 'edit' | 'compare'
  const [showCompareAfter, setShowCompareAfter] = useState(true);
  const [hasMask, setHasMask] = useState(false);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef(null);
  const canvasRef = useRef(null); // display canvas (image + overlay)
  const maskCanvasRef = useRef(null); // offscreen binary mask canvas
  const drawingRef = useRef(false);

  // Load image into display + mask canvases on file change
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Fit to reasonable display size while keeping original for download
      const maxDisplay = 800;
      let w = img.width;
      let h = img.height;
      if (Math.max(w, h) > maxDisplay) {
        const s = maxDisplay / Math.max(w, h);
        w = Math.round(w * s);
        h = Math.round(h * s);
      }
      const c = canvasRef.current;
      const mc = maskCanvasRef.current;
      if (!c || !mc) return;
      c.width = w;
      c.height = h;
      mc.width = w;
      mc.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      mc.getContext("2d").clearRect(0, 0, w, h);
      setOrigImg(img);
      setHasMask(false);
      setResultCanvas(null);
      setError(null);
      setViewMode("edit");
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setError("Failed to load image");
    img.src = url;
  }, [file]);

  const redrawOverlay = useCallback(() => {
    const c = canvasRef.current;
    const mc = maskCanvasRef.current;
    if (!c || !origImg || !mc) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(origImg, 0, 0, c.width, c.height);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(mc, 0, 0);
    ctx.globalAlpha = 1;
  }, [origImg]);

  const coords = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const cx = e.clientX ?? e.touches?.[0]?.clientX;
    const cy = e.clientY ?? e.touches?.[0]?.clientY;
    return {
      x: ((cx - r.left) * c.width) / r.width,
      y: ((cy - r.top) * c.height) / r.height,
    };
  };

  const drawAt = (e) => {
    if (!drawingRef.current) return;
    const mc = maskCanvasRef.current;
    if (!mc) return;
    const { x, y } = coords(e);
    const ctx = mc.getContext("2d");
    ctx.fillStyle = "rgba(236, 72, 153, 0.95)"; // pink
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasMask(true);
    redrawOverlay();
  };

  const startDraw = (e) => {
    if (viewMode !== "edit" || !origImg || stage) return;
    e.preventDefault();
    drawingRef.current = true;
    drawAt(e);
  };
  const endDraw = () => (drawingRef.current = false);

  const clearMask = () => {
    const mc = maskCanvasRef.current;
    if (!mc) return;
    mc.getContext("2d").clearRect(0, 0, mc.width, mc.height);
    setHasMask(false);
    redrawOverlay();
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Not an image file");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRun = async () => {
    if (!origImg || !hasMask || stage) return;
    setError(null);
    try {
      if (!sessionCache) {
        setStage("loading-model");
        setProgress(0);
        await getSession((p) => setProgress(Math.round(p * 100)));
      }
      setStage("processing");
      const inpainted512 = await runInpaint(origImg, maskCanvasRef.current);

      // Composite: original (full res) + inpainted result masked by user's mask
      const outCan = document.createElement("canvas");
      outCan.width = origImg.width;
      outCan.height = origImg.height;
      const octx = outCan.getContext("2d");
      octx.drawImage(origImg, 0, 0);

      // Prepare masked result at original res
      const maskedResult = document.createElement("canvas");
      maskedResult.width = origImg.width;
      maskedResult.height = origImg.height;
      const mrctx = maskedResult.getContext("2d");
      mrctx.drawImage(inpainted512, 0, 0, origImg.width, origImg.height);
      mrctx.globalCompositeOperation = "destination-in";
      mrctx.drawImage(
        maskCanvasRef.current,
        0,
        0,
        origImg.width,
        origImg.height
      );
      mrctx.globalCompositeOperation = "source-over";

      octx.drawImage(maskedResult, 0, 0);

      setResultCanvas(outCan);
      setViewMode("compare");
      setShowCompareAfter(true);
      setStage(null);
    } catch (e) {
      console.error("[RemoveWatermark] inference failed", e);
      const msg = e?.message || "Inpainting failed";
      // Known errors get a more actionable hint
      if (/getValue|SharedArrayBuffer|wasm/i.test(msg)) {
        setError(
          msg +
            " · 如果首次运行，请刷新页面重试；也可以打开浏览器控制台查看详情。"
        );
      } else {
        setError(msg);
      }
      setStage(null);
    }
  };

  const handleDownload = () => {
    if (!resultCanvas || !file) return;
    resultCanvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      a.download = `${base}.nowm.png`;
      a.click();
    }, "image/png");
  };

  const handleReset = () => {
    setFile(null);
    setOrigImg(null);
    setResultCanvas(null);
    setHasMask(false);
    setError(null);
    setStage(null);
    setViewMode("edit");
  };

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
        title={t("tools.removeWatermark.name")}
        description={t("tools.removeWatermark.desc")}
        path="/tools/remove-watermark"
        structuredData={schema.softwareApp({
          name: "OneTools AI Remove Watermark",
          description: t("tools.removeWatermark.desc"),
          url: "https://onetools.dev/tools/remove-watermark",
        })}
      />
    <div
      style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
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
            {t("tools.removeWatermark.name")}
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {" "}LaMa
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
            {t("tools.removeWatermark.desc")}
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
          {t("tools.removeWatermark.badge")}
        </span>
      </div>

      {/* Legal notice */}
      <div
        style={{
          marginTop: 20,
          padding: "10px 14px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.28)",
          fontSize: 12.5,
          color: "#a76200",
          lineHeight: 1.55,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠️</span>
        <span>
          <strong>{t("tools.removeWatermark.legalTitle")}</strong>{" "}
          {t("tools.removeWatermark.legalDesc")}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: "none" }}
      />

      {/* Empty state */}
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            marginTop: 20,
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
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 4,
              letterSpacing: -0.2,
            }}
          >
            {t("tools.removeWatermark.dropHere")}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {t("tools.removeWatermark.modelHint")}
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: "var(--radius)",
              background: "#ffffff",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              alignItems: "center",
            }}
          >
            {/* View mode switcher */}
            {resultCanvas && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: 3,
                  background: "var(--bg-subtle)",
                  borderRadius: 999,
                }}
              >
                {["edit", "compare"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      border: "none",
                      background:
                        viewMode === m ? "var(--text-primary)" : "transparent",
                      color: viewMode === m ? "#fff" : "var(--text-secondary)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {m === "edit"
                      ? t("tools.removeWatermark.editMode")
                      : t("tools.removeWatermark.compareMode")}
                  </button>
                ))}
              </div>
            )}

            {viewMode === "edit" && (
              <>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                  }}
                >
                  {t("tools.removeWatermark.brushSize")}{" "}
                  <span
                    style={{
                      color: "var(--brand)",
                      fontWeight: 600,
                      minWidth: 22,
                      textAlign: "right",
                    }}
                  >
                    {brushSize}
                  </span>
                  <input
                    type="range"
                    min={6}
                    max={80}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    style={{ width: 120, accentColor: "var(--brand)" }}
                  />
                </label>

                <button
                  onClick={clearMask}
                  disabled={!hasMask || stage}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "#ffffff",
                    color: hasMask ? "var(--text-secondary)" : "var(--text-faint)",
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: hasMask ? "pointer" : "not-allowed",
                    opacity: hasMask ? 1 : 0.55,
                  }}
                >
                  ↺ {t("tools.removeWatermark.clearMask")}
                </button>
              </>
            )}

            {viewMode === "compare" && (
              <div style={{ display: "flex", gap: 6 }}>
                {[true, false].map((after) => (
                  <button
                    key={String(after)}
                    onClick={() => setShowCompareAfter(after)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      border: "1px solid var(--border)",
                      background:
                        showCompareAfter === after
                          ? "var(--text-primary)"
                          : "#ffffff",
                      color:
                        showCompareAfter === after ? "#fff" : "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {after
                      ? t("tools.removeWatermark.after")
                      : t("tools.removeWatermark.before")}
                  </button>
                ))}
              </div>
            )}

            <div style={{ flex: 1 }} />

            <button
              onClick={handleReset}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                background: "#ffffff",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {t("tools.removeWatermark.replace")}
            </button>
            <button
              onClick={handleRun}
              disabled={!hasMask || stage}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background:
                  !hasMask || stage ? "#d8d8e0" : "var(--gradient-brand)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: -0.1,
                boxShadow:
                  !hasMask || stage ? "none" : "0 4px 14px rgba(91,91,245,0.35)",
                cursor: !hasMask || stage ? "not-allowed" : "pointer",
              }}
            >
              {stage === "loading-model"
                ? t("tools.removeWatermark.loadingModel") + " " + progress + "%"
                : stage === "processing"
                ? t("tools.removeWatermark.processing")
                : "✦ " + t("tools.removeWatermark.run")}
            </button>
            <button
              onClick={handleDownload}
              disabled={!resultCanvas}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: resultCanvas ? "var(--text-primary)" : "#d8d8e0",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: -0.1,
                boxShadow: resultCanvas
                  ? "0 4px 14px rgba(10,11,16,0.2)"
                  : "none",
              }}
            >
              ⬇ {t("tools.removeWatermark.download")}
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
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

          {/* Canvas area */}
          <div style={{ marginTop: 14, ...panel, marginBottom: 20 }}>
            <div style={panelHeader}>
              <span>
                {viewMode === "edit"
                  ? t("tools.removeWatermark.editLabel")
                  : showCompareAfter
                  ? t("tools.removeWatermark.after")
                  : t("tools.removeWatermark.before")}
              </span>
              <span style={{ color: "var(--text-faint)" }}>
                {origImg
                  ? `${origImg.width} × ${origImg.height} · ${formatSize(
                      file.size
                    )}`
                  : ""}
              </span>
            </div>
            <div
              style={{
                padding: 16,
                minHeight: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "repeating-conic-gradient(#f3f4f7 0 25%, #ffffff 0 50%) 0 0 / 20px 20px",
              }}
            >
              {/* Edit canvas (visible in 'edit' mode) */}
              <canvas
                ref={canvasRef}
                onPointerDown={startDraw}
                onPointerMove={drawAt}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                style={{
                  display: viewMode === "edit" ? "block" : "none",
                  maxWidth: "100%",
                  maxHeight: 560,
                  touchAction: "none",
                  cursor: stage ? "wait" : "crosshair",
                  borderRadius: 6,
                  boxShadow: "0 1px 3px rgba(10,11,16,0.1)",
                }}
              />
              <canvas
                ref={maskCanvasRef}
                style={{ display: "none" }}
              />

              {/* Compare view */}
              {viewMode === "compare" && (
                <img
                  src={
                    showCompareAfter && resultCanvas
                      ? resultCanvas.toDataURL()
                      : origImg?.src
                  }
                  alt=""
                  style={{
                    maxWidth: "100%",
                    maxHeight: 560,
                    borderRadius: 6,
                  }}
                />
              )}
            </div>

            {/* Progress bar overlay inside panel when running */}
            {stage && (
              <div
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid var(--border-light)",
                  background: "rgba(91,91,245,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--brand)",
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {stage === "loading-model"
                    ? t("tools.removeWatermark.loadingModel")
                    : t("tools.removeWatermark.processing")}
                </div>
                <div
                  style={{
                    height: 6,
                    background: "rgba(91,91,245,0.15)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width:
                        stage === "processing"
                          ? "100%"
                          : `${progress || 3}%`,
                      height: "100%",
                      background: "var(--gradient-brand)",
                      transition: "width 0.2s ease",
                      animation:
                        stage === "processing"
                          ? "shimmer 1.2s ease infinite"
                          : "none",
                      backgroundSize:
                        stage === "processing" ? "200% 100%" : "100% 100%",
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {stage === "loading-model"
                    ? `${progress}%`
                    : t("tools.removeWatermark.processingHint")}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Info panel */}
      {!file && (
        <div
          style={{
            marginTop: 16,
            marginBottom: 72,
            padding: "16px 18px",
            borderRadius: "var(--radius)",
            background: "rgba(91,91,245,0.05)",
            border: "1px solid rgba(91,91,245,0.18)",
            fontSize: 12.5,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "var(--brand)",
              marginBottom: 4,
            }}
          >
            ℹ︎ {t("tools.removeWatermark.privacyTitle")}
          </div>
          {t("tools.removeWatermark.privacyDesc")}
        </div>
      )}

      <FaqSection
        title={t("faq.title")}
        items={t("faq.removeWatermark", { returnObjects: true })}
        path="/tools/remove-watermark"
      />
    </div>
    </>
  );
}
