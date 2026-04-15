import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

const FFMPEG_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

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
  const u = ["B", "KB", "MB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`;
}

function secsToHms(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
}

export default function VideoToGif() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(3);
  const [fps, setFps] = useState(12);
  const [width, setWidth] = useState(480);
  const [stage, setStage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    // eslint-disable-next-line
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    const isVideo = f.type.startsWith("video/") || /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(f.name);
    if (!isVideo) { setError(t("tools.videoToGif.notVideo")); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultBlob(null); setResultUrl(null); setError(null);
    setStart(0); setLength(3);
  };

  const onMetadata = () => {
    if (!videoRef.current) return;
    const d = videoRef.current.duration || 0;
    setDuration(d);
    setLength(Math.min(3, d));
  };

  const convert = async () => {
    if (!file || stage) return;
    setError(null); setResultBlob(null); setResultUrl(null);
    try {
      setStage("load");
      const ff = await getFFmpeg();

      setStage("run");
      setProgress(0);
      const { fetchFile } = await import("@ffmpeg/util");
      const inName = "input" + (file.name.match(/\.[^.]+$/) || [".mp4"])[0];
      await ff.writeFile(inName, await fetchFile(file));

      // Two-pass: palette generation for better GIF colors, then encode
      const palette = "palette.png";
      await ff.exec([
        "-ss", String(start),
        "-t", String(length),
        "-i", inName,
        "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
        palette,
      ]);
      setProgress(50);

      const outName = "out.gif";
      await ff.exec([
        "-ss", String(start),
        "-t", String(length),
        "-i", inName,
        "-i", palette,
        "-lavfi", `fps=${fps},scale=${width}:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5`,
        outName,
      ]);
      setProgress(95);

      const data = await ff.readFile(outName);
      const blob = new Blob([data.buffer], { type: "image/gif" });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));

      try {
        await ff.deleteFile(inName);
        await ff.deleteFile(palette);
        await ff.deleteFile(outName);
      } catch {}
      setProgress(100);
      setStage(null);
    } catch (e) {
      setError(e?.message || "Conversion failed");
      setStage(null);
    }
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${base}.gif`;
    a.click();
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreviewUrl(null); setResultBlob(null); setResultUrl(null);
    setStage(null); setError(null); setProgress(0);
  };

  const panel = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "var(--bg-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  return (
    <>
      <SEO
        title={t("tools.videoToGif.name")}
        description={t("tools.videoToGif.desc")}
        path="/tools/video-to-gif"
        structuredData={schema.softwareApp({
          name: "OneTools Video to GIF",
          description: t("tools.videoToGif.desc"),
          url: "https://onetools.dev/tools/video-to-gif",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.videoToGif.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · GIF</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.videoToGif.desc")}
          </p>
        </div>

        <input ref={inputRef} type="file" accept="video/*,.mp4,.mov,.webm,.m4v,.mkv"
          onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

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
              background: dragging ? "rgba(91,91,245,0.06)" : "var(--bg-card)",
              cursor: "pointer", boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎞️</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t("tools.videoToGif.dropHere")}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t("tools.videoToGif.hint")}</div>
          </div>
        ) : (
          <>
            <div style={{ padding: "24px 0 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={panel}>
                <div style={panelHeader}>{t("tools.videoToGif.sourceVideo")}</div>
                <div style={{ padding: 14, background: "#000" }}>
                  <video ref={videoRef} src={previewUrl} controls
                    onLoadedMetadata={onMetadata}
                    style={{ width: "100%", maxHeight: 300, background: "#000" }} />
                </div>
                <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  <span>{file.name} · {formatSize(file.size)}</span>
                  <span>{duration ? secsToHms(duration) : "—"}</span>
                </div>
              </div>

              <div style={panel}>
                <div style={panelHeader}>{t("tools.videoToGif.settings")}</div>
                <div style={{ padding: 14 }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      {t("tools.videoToGif.startTime")}
                      <span style={{ color: "var(--brand)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                        {secsToHms(start)}
                      </span>
                    </label>
                    <input type="range" min={0} max={Math.max(0, duration - 0.5)} step={0.1}
                      value={start} onChange={(e) => setStart(+e.target.value)}
                      style={{ width: "100%", accentColor: "var(--brand)" }} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      {t("tools.videoToGif.duration")}
                      <span style={{ color: "var(--brand)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                        {length.toFixed(1)}s
                      </span>
                    </label>
                    <input type="range" min={0.5} max={Math.min(15, Math.max(1, duration - start))} step={0.1}
                      value={length} onChange={(e) => setLength(+e.target.value)}
                      style={{ width: "100%", accentColor: "var(--brand)" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                        FPS: <span style={{ color: "var(--brand)", fontWeight: 600 }}>{fps}</span>
                      </label>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[8, 12, 15, 20, 24].map((n) => (
                          <button key={n} onClick={() => setFps(n)}
                            style={{
                              flex: 1, padding: "5px 0", borderRadius: 6,
                              border: fps === n ? "1px solid var(--brand)" : "1px solid var(--border)",
                              background: fps === n ? "rgba(91,91,245,0.08)" : "var(--bg-card)",
                              color: fps === n ? "var(--brand)" : "var(--text-secondary)",
                              fontSize: 11.5, fontWeight: 600,
                            }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                        {t("tools.videoToGif.width")}: <span style={{ color: "var(--brand)", fontWeight: 600 }}>{width}px</span>
                      </label>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[240, 360, 480, 640].map((n) => (
                          <button key={n} onClick={() => setWidth(n)}
                            style={{
                              flex: 1, padding: "5px 0", borderRadius: 6,
                              border: width === n ? "1px solid var(--brand)" : "1px solid var(--border)",
                              background: width === n ? "rgba(91,91,245,0.08)" : "var(--bg-card)",
                              color: width === n ? "var(--brand)" : "var(--text-secondary)",
                              fontSize: 11, fontWeight: 600,
                            }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button onClick={reset}
                      style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                      {t("tools.videoToGif.replace")}
                    </button>
                    <button onClick={convert} disabled={!!stage}
                      style={{
                        flex: 1, padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none",
                        background: stage ? "#d8d8e0" : "var(--gradient-brand)",
                        color: "#fff", fontSize: 13, fontWeight: 600,
                        cursor: stage ? "wait" : "pointer",
                        boxShadow: stage ? "none" : "0 4px 14px rgba(91,91,245,0.35)",
                      }}>
                      {stage === "load" ? t("tools.videoToGif.loading")
                       : stage === "run" ? t("tools.videoToGif.converting") + " " + progress + "%"
                       : "✦ " + t("tools.videoToGif.convert")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
                {error}
              </div>
            )}

            {stage === "run" && (
              <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(91,91,245,0.05)", border: "1px solid rgba(91,91,245,0.18)" }}>
                <div style={{ height: 5, background: "rgba(91,91,245,0.15)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress || 3}%`, background: "var(--gradient-brand)", transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            {resultUrl && (
              <div style={{ ...panel, marginBottom: 30 }}>
                <div style={panelHeader}>
                  <span>GIF {t("tools.videoToGif.result")}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "var(--green)", fontSize: 11.5, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                      {formatSize(resultBlob.size)}
                    </span>
                    <button onClick={download}
                      style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontSize: 11.5, fontWeight: 600 }}>
                      ⬇ GIF
                    </button>
                  </div>
                </div>
                <div style={{ padding: 20, background: "repeating-conic-gradient(#f3f4f7 0 25%, #ffffff 0 50%) 0 0 / 20px 20px", display: "flex", justifyContent: "center" }}>
                  <img src={resultUrl} alt="" style={{ maxWidth: "100%", maxHeight: 500 }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
