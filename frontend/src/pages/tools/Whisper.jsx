import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

// Whisper models on Hugging Face (ONNX-converted by Xenova).
// Smaller = faster to download and run, but less accurate, especially on
// accents / noisy audio.
const MODELS = [
  { id: "Xenova/whisper-tiny",  sizeMb: 39,  labelKey: "tools.whisper.model_tiny" },
  { id: "Xenova/whisper-base",  sizeMb: 74,  labelKey: "tools.whisper.model_base" },
  { id: "Xenova/whisper-small", sizeMb: 244, labelKey: "tools.whisper.model_small" },
];

let pipelinePromise = null;
let loadedModelId = null;

async function getPipeline(modelId, onProgress) {
  if (pipelinePromise && loadedModelId === modelId) return pipelinePromise;
  pipelinePromise = (async () => {
    const { pipeline, env } = await import("@xenova/transformers");
    // Serve model files from the official CDN
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    const p = await pipeline("automatic-speech-recognition", modelId, {
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
    loadedModelId = modelId;
    return p;
  })();
  return pipelinePromise;
}

function formatTimestamp(sec) {
  if (sec == null) return "";
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ms = Math.floor((sec - total) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function toSrt(chunks) {
  if (!chunks?.length) return "";
  return chunks
    .map((c, i) => {
      const [start, end] = c.timestamp || [];
      if (start == null || end == null) return "";
      return `${i + 1}\n${formatTimestamp(start)} --> ${formatTimestamp(end)}\n${c.text.trim()}\n`;
    })
    .filter(Boolean)
    .join("\n");
}

async function decodeAudio(file) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate: 16000 });
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  // Mono, 16kHz — Whisper expects this shape
  if (audioBuffer.numberOfChannels === 1) return audioBuffer.getChannelData(0);
  const len = audioBuffer.length;
  const out = new Float32Array(len);
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(1);
  for (let i = 0; i < len; i++) out[i] = (left[i] + right[i]) / 2;
  return out;
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`;
}

export default function Whisper() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [stage, setStage] = useState(null); // 'load' | 'decode' | 'transcribe' | null
  const [progress, setProgress] = useState(0);
  const [progressFile, setProgressFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [viewMode, setViewMode] = useState("text"); // 'text' | 'srt' | 'chunks'
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];

  const handleFile = (f) => {
    if (!f) return;
    const isAudio = f.type.startsWith("audio/") || f.type.startsWith("video/") ||
      /\.(mp3|m4a|wav|ogg|webm|flac|mp4|mov)$/i.test(f.name);
    if (!isAudio) { setError(t("tools.whisper.notAudio")); return; }
    setError(null);
    setResult(null);
    setFile(f);
  };

  const transcribe = async () => {
    if (!file || stage) return;
    setError(null);
    setResult(null);
    try {
      setStage("load");
      setProgress(0);
      const transcriber = await getPipeline(modelId, (p) => {
        if (p.stage === "download") {
          setProgressFile(p.file);
          setProgress(p.pct);
        }
      });

      setStage("decode");
      setProgress(0);
      const audioData = await decodeAudio(file);

      setStage("transcribe");
      setProgress(0);
      const output = await transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      });
      setResult(output);
      setStage(null);
    } catch (e) {
      setError(e?.message || "Transcription failed");
      setStage(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
    };
  }, []);

  const reset = () => {
    setFile(null); setResult(null); setError(null); setStage(null);
  };

  const copyText = (kind, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const download = (filename, text, mime) => {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const panel = { background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "#fafbfc", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  const srtText = result ? toSrt(result.chunks) : "";

  return (
    <>
      <SEO
        title={t("tools.whisper.name")}
        description={t("tools.whisper.desc")}
        path="/tools/whisper"
        structuredData={schema.softwareApp({
          name: "OneTools Local Whisper",
          description: t("tools.whisper.desc"),
          url: "https://onetools.dev/tools/whisper",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
              {t("tools.whisper.name")}
              <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · Whisper</span>
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
              {t("tools.whisper.desc")}
            </p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 999,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)",
            color: "var(--green)", fontSize: 11.5, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            {t("tools.whisper.badge")}
          </span>
        </div>

        <input ref={inputRef} type="file"
          accept="audio/*,video/*,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.mov,.flac"
          onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

        {/* Model picker + file */}
        <div style={{ padding: "24px 0 14px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("tools.whisper.modelLabel")}:</span>
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
              {t(m.labelKey)} <span style={{ opacity: 0.7, fontFamily: "var(--font-mono)", fontSize: 10 }}>{m.sizeMb} MB</span>
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
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎤</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {t("tools.whisper.dropHere")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.whisper.hint")}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>🎵 {file.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                  {formatSize(file.size)}
                </div>
              </div>
              <button onClick={reset}
                style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "#ffffff", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                {t("tools.whisper.replace")}
              </button>
              <button onClick={transcribe} disabled={!!stage}
                style={{
                  padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none",
                  background: stage ? "#d8d8e0" : "var(--gradient-brand)",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: stage ? "wait" : "pointer",
                  boxShadow: stage ? "none" : "0 4px 14px rgba(91,91,245,0.35)",
                }}>
                {stage === "load" ? t("tools.whisper.loading") :
                 stage === "decode" ? t("tools.whisper.decoding") :
                 stage === "transcribe" ? t("tools.whisper.transcribing") :
                 "✦ " + t("tools.whisper.transcribe")}
              </button>
            </div>

            {/* Audio preview */}
            <audio ref={audioRef} controls src={URL.createObjectURL(file)}
              style={{ width: "100%", marginBottom: 14 }} />

            {/* Progress */}
            {stage && (
              <div style={{
                marginBottom: 14, padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(91,91,245,0.05)",
                border: "1px solid rgba(91,91,245,0.18)",
              }}>
                <div style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                  {stage === "load" ? t("tools.whisper.loadingModel", { name: t(model.labelKey), size: model.sizeMb })
                   : stage === "decode" ? t("tools.whisper.decodingAudio")
                   : t("tools.whisper.runningInference")}
                  {stage === "load" && progressFile && (
                    <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", textTransform: "none", letterSpacing: 0 }}>
                      {progressFile}
                    </span>
                  )}
                </div>
                {stage === "load" && (
                  <>
                    <div style={{ height: 5, background: "rgba(91,91,245,0.15)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progress || 3}%`, background: "var(--gradient-brand)", transition: "width 0.3s" }} />
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {progress}%
                    </div>
                  </>
                )}
                {stage === "transcribe" && (
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

            {/* Result */}
            {result && (
              <div style={{ ...panel, marginBottom: 20 }}>
                <div style={panelHeader}>
                  <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--bg-subtle)", borderRadius: 999 }}>
                    {["text", "srt", "chunks"].map((m) => (
                      <button key={m} onClick={() => setViewMode(m)}
                        style={{
                          padding: "4px 10px", borderRadius: 999, border: "none",
                          background: viewMode === m ? "var(--text-primary)" : "transparent",
                          color: viewMode === m ? "#fff" : "var(--text-secondary)",
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}>
                        {m === "text" ? t("tools.whisper.plain")
                         : m === "srt" ? "SRT"
                         : t("tools.whisper.segments")}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {viewMode === "text" && (
                      <>
                        <button onClick={() => copyText("text", result.text)}
                          style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: copied === "text" ? "rgba(16,185,129,0.1)" : "#ffffff", color: copied === "text" ? "var(--green)" : "var(--text-secondary)", fontSize: 11 }}>
                          {copied === "text" ? "✓" : "⎘"} TXT
                        </button>
                        <button onClick={() => download("transcript.txt", result.text, "text/plain")}
                          style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "#ffffff", color: "var(--text-secondary)", fontSize: 11 }}>
                          ⬇ TXT
                        </button>
                      </>
                    )}
                    {viewMode === "srt" && (
                      <>
                        <button onClick={() => copyText("srt", srtText)}
                          style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: copied === "srt" ? "rgba(16,185,129,0.1)" : "#ffffff", color: copied === "srt" ? "var(--green)" : "var(--text-secondary)", fontSize: 11 }}>
                          {copied === "srt" ? "✓" : "⎘"} SRT
                        </button>
                        <button onClick={() => download("subtitles.srt", srtText, "text/plain")}
                          style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "#ffffff", color: "var(--text-secondary)", fontSize: 11 }}>
                          ⬇ SRT
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{
                  padding: 18, maxHeight: 500, overflow: "auto",
                  fontSize: viewMode === "srt" ? 12 : 14,
                  fontFamily: viewMode === "srt" ? "var(--font-mono)" : "inherit",
                  lineHeight: 1.7, color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                }}>
                  {viewMode === "text" && result.text}
                  {viewMode === "srt" && srtText}
                  {viewMode === "chunks" && (
                    <div>
                      {result.chunks?.map((c, i) => (
                        <div key={i} style={{
                          padding: "10px 0", borderBottom: "1px solid var(--border-light)",
                          display: "flex", gap: 14,
                        }}>
                          <div style={{
                            flexShrink: 0, fontFamily: "var(--font-mono)",
                            fontSize: 11, color: "var(--brand)", width: 110,
                            fontWeight: 600,
                          }}>
                            {c.timestamp?.[0] != null ? formatTimestamp(c.timestamp[0]) : "?"}
                          </div>
                          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.55 }}>
                            {c.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
              ℹ︎ {t("tools.whisper.privacyTitle")}
            </div>
            {t("tools.whisper.privacyDesc")}
          </div>
        )}
      </div>
    </>
  );
}
