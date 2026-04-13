import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

// FFmpeg core 0.12 single-threaded (no SharedArrayBuffer needed → works on
// Vercel without COOP/COEP headers). Slower than MT but compatible everywhere.
const FFMPEG_BASE =
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

const PRESETS = [
  {
    id: "wechat",
    labelKey: "tools.videoCompress.preset_wechat",
    descKey: "tools.videoCompress.preset_wechat_desc",
    args: ["-c:v", "libx264", "-preset", "veryfast", "-crf", "30",
           "-vf", "scale='min(1280,iw)':-2", "-c:a", "aac", "-b:a", "96k",
           "-movflags", "+faststart"],
  },
  {
    id: "balanced",
    labelKey: "tools.videoCompress.preset_balanced",
    descKey: "tools.videoCompress.preset_balanced_desc",
    args: ["-c:v", "libx264", "-preset", "medium", "-crf", "24",
           "-vf", "scale='min(1920,iw)':-2", "-c:a", "aac", "-b:a", "128k",
           "-movflags", "+faststart"],
  },
  {
    id: "hd",
    labelKey: "tools.videoCompress.preset_hd",
    descKey: "tools.videoCompress.preset_hd_desc",
    args: ["-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-c:a", "aac", "-b:a", "192k",
           "-movflags", "+faststart"],
  },
  {
    id: "small",
    labelKey: "tools.videoCompress.preset_small",
    descKey: "tools.videoCompress.preset_small_desc",
    args: ["-c:v", "libx264", "-preset", "veryfast", "-crf", "34",
           "-vf", "scale='min(854,iw)':-2", "-c:a", "aac", "-b:a", "64k",
           "-movflags", "+faststart"],
  },
];

let ffmpegPromise = null;

async function getFFmpeg(onLog) {
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ff = new FFmpeg();
    ff.on("log", ({ message }) => onLog?.(message));
    await ff.load({
      coreURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    return ff;
  })();
  return ffmpegPromise;
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`;
}

function parseDurationFromLog(line) {
  const m = /Duration:\s*(\d+):(\d+):(\d+\.?\d*)/.exec(line);
  if (!m) return null;
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

function parseTimeFromLog(line) {
  const m = /time=(\d+):(\d+):(\d+\.?\d*)/.exec(line);
  if (!m) return null;
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

export default function VideoCompress() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [preset, setPreset] = useState("wechat");
  const [stage, setStage] = useState(null);      // 'load' | 'run' | null
  const [progress, setProgress] = useState(0);   // 0-100
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [logTail, setLogTail] = useState("");
  const durationRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    // eslint-disable-next-line
  }, []);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreviewUrl(null);
    setResultBlob(null); setResultUrl(null);
    setError(null); setStage(null); setProgress(0); setLogTail("");
  };

  const handleFile = (f) => {
    if (!f) return;
    const isVideo = f.type.startsWith("video/") ||
      /\.(mp4|mov|webm|avi|mkv|flv|m4v)$/i.test(f.name);
    if (!isVideo) { setError(t("tools.videoCompress.notVideo")); return; }
    reset();
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const compress = async () => {
    if (!file || stage) return;
    setError(null); setResultBlob(null); setResultUrl(null);
    durationRef.current = null;

    try {
      setStage("load");
      const ff = await getFFmpeg((line) => {
        setLogTail(line);
        // Parse progress from FFmpeg's console output
        const d = parseDurationFromLog(line);
        if (d) durationRef.current = d;
        const cur = parseTimeFromLog(line);
        if (cur && durationRef.current) {
          setProgress(Math.min(100, Math.round((cur / durationRef.current) * 100)));
        }
      });

      setStage("run");
      setProgress(0);

      const inName = "input" + (file.name.match(/\.[^.]+$/) || [".mp4"])[0];
      const outName = "output.mp4";

      const { fetchFile } = await import("@ffmpeg/util");
      await ff.writeFile(inName, await fetchFile(file));

      const args = ["-i", inName,
        ...(PRESETS.find((p) => p.id === preset)?.args || []),
        outName];
      await ff.exec(args);

      const data = await ff.readFile(outName);
      const blob = new Blob([data.buffer], { type: "video/mp4" });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);

      try { await ff.deleteFile(inName); await ff.deleteFile(outName); } catch {}
      setStage(null);
    } catch (e) {
      setError(e?.message || "Compression failed");
      setStage(null);
    }
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${base}.compressed.mp4`;
    a.click();
  };

  const savedPct = file && resultBlob
    ? Math.round((1 - resultBlob.size / file.size) * 100)
    : 0;

  const panel = { background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "#fafbfc", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  return (
    <>
      <SEO
        title={t("tools.videoCompress.name")}
        description={t("tools.videoCompress.desc")}
        path="/tools/video-compress"
        structuredData={schema.softwareApp({
          name: "OneTools Video Compress",
          description: t("tools.videoCompress.desc"),
          url: "https://onetools.dev/tools/video-compress",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
              {t("tools.videoCompress.name")}
              <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · FFmpeg.wasm</span>
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
              {t("tools.videoCompress.desc")}
            </p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 999,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)",
            color: "var(--green)", fontSize: 11.5, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            {t("tools.videoCompress.badge")}
          </span>
        </div>

        <input ref={inputRef} type="file"
          accept="video/*,.mp4,.mov,.webm,.avi,.mkv,.flv,.m4v"
          onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

        {/* Preset picker */}
        <div style={{ padding: "24px 0 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPreset(p.id)} disabled={!!stage}
              style={{
                padding: "12px 14px", borderRadius: "var(--radius-sm)",
                border: preset === p.id ? "1px solid var(--brand)" : "1px solid var(--border)",
                background: preset === p.id ? "rgba(91,91,245,0.06)" : "#ffffff",
                textAlign: "left", cursor: stage ? "not-allowed" : "pointer",
              }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: preset === p.id ? "var(--brand)" : "var(--text-primary)", marginBottom: 3 }}>
                {t(p.labelKey)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {t(p.descKey)}
              </div>
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
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {t("tools.videoCompress.dropHere")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.videoCompress.hint")}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>🎥 {file.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                  {formatSize(file.size)}
                  {resultBlob && ` → ${formatSize(resultBlob.size)} (${savedPct >= 0 ? "−" : "+"}${Math.abs(savedPct)}%)`}
                </div>
              </div>
              <button onClick={reset}
                style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "#ffffff", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                {t("tools.videoCompress.replace")}
              </button>
              <button onClick={compress} disabled={!!stage}
                style={{
                  padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none",
                  background: stage ? "#d8d8e0" : "var(--gradient-brand)",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: stage ? "wait" : "pointer",
                  boxShadow: stage ? "none" : "0 4px 14px rgba(91,91,245,0.35)",
                }}>
                {stage === "load" ? t("tools.videoCompress.loading") :
                 stage === "run" ? t("tools.videoCompress.compressing") :
                 "✦ " + t("tools.videoCompress.compress")}
              </button>
              <button onClick={download} disabled={!resultBlob}
                style={{ padding: "8px 18px", borderRadius: "var(--radius-sm)", border: "none", background: resultBlob ? "var(--text-primary)" : "#d8d8e0", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: resultBlob ? "0 4px 14px rgba(10,11,16,0.2)" : "none" }}>
                ⬇ MP4
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
                  {stage === "load" ? t("tools.videoCompress.loadingFfmpeg")
                   : t("tools.videoCompress.compressing") + ` ${progress}%`}
                </div>
                <div style={{ height: 5, background: "rgba(91,91,245,0.15)", borderRadius: 999, overflow: "hidden", position: "relative" }}>
                  {stage === "run" && progress > 0 ? (
                    <div style={{ height: "100%", width: `${progress}%`, background: "var(--gradient-brand)", transition: "width 0.3s" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(91,91,245,0.5), transparent)", animation: "shimmer 1.6s ease infinite", backgroundSize: "200% 100%" }} />
                  )}
                </div>
                {logTail && (
                  <div style={{
                    marginTop: 8, fontSize: 10.5, color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {logTail}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: resultUrl ? "1fr 1fr" : "1fr", gap: 12, paddingBottom: 20 }}>
              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.videoCompress.original")}</span>
                  <span style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{formatSize(file.size)}</span>
                </div>
                <div style={{ padding: 16, background: "#000" }}>
                  <video src={previewUrl} controls style={{ width: "100%", maxHeight: 420, background: "#000" }} />
                </div>
              </div>
              {resultUrl && (
                <div style={panel}>
                  <div style={panelHeader}>
                    <span>{t("tools.videoCompress.compressed")}</span>
                    <span style={{ color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>
                      {formatSize(resultBlob.size)} · {savedPct >= 0 ? "−" : "+"}{Math.abs(savedPct)}%
                    </span>
                  </div>
                  <div style={{ padding: 16, background: "#000" }}>
                    <video src={resultUrl} controls style={{ width: "100%", maxHeight: 420, background: "#000" }} />
                  </div>
                </div>
              )}
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
              ℹ︎ {t("tools.videoCompress.privacyTitle")}
            </div>
            {t("tools.videoCompress.privacyDesc")}
          </div>
        )}
      </div>
    </>
  );
}
