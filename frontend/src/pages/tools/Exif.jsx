import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`;
}

// Fields worth flagging as privacy risks
const SENSITIVE = {
  latitude:        "gps",
  longitude:       "gps",
  GPSLatitude:     "gps",
  GPSLongitude:    "gps",
  gps:             "gps",
  SerialNumber:    "serial",
  LensSerialNumber:"serial",
  OwnerName:       "identity",
  Artist:          "identity",
  Copyright:       "identity",
  ImageUniqueID:   "identity",
  HostComputer:    "device",
};

function classify(key) {
  for (const [k, kind] of Object.entries(SENSITIVE)) {
    if (key === k || key.toLowerCase().includes(k.toLowerCase())) return kind;
  }
  return null;
}

function formatValue(v) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v).slice(0, 120);
  return String(v).slice(0, 200);
}

export default function ExifTool() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [cleanedUrl, setCleanedUrl] = useState(null);
  const [cleanedBlob, setCleanedBlob] = useState(null);
  const inputRef = useRef(null);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (cleanedUrl) URL.revokeObjectURL(cleanedUrl);
    setFile(null); setPreview(null); setMeta(null); setError(null);
    setCleanedUrl(null); setCleanedBlob(null);
  };

  const handleFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError(t("tools.exif.notImage")); return; }
    reset();
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setLoading(true);
    try {
      const exifr = (await import("exifr")).default;
      const data = await exifr.parse(f, {
        gps: true, xmp: true, iptc: true, icc: true,
        interop: false, makerNote: false,
      });
      setMeta(data || {});
    } catch (e) {
      setError((e?.message || "Parse failed"));
    } finally {
      setLoading(false);
    }
  };

  const stripExif = async () => {
    if (!file) return;
    // Re-encode via canvas — this naturally drops all metadata
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = URL.createObjectURL(file);
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
      const quality = 0.96;
      const blob = await new Promise((res) =>
        canvas.toBlob(res, mime, quality)
      );
      if (cleanedUrl) URL.revokeObjectURL(cleanedUrl);
      setCleanedBlob(blob);
      setCleanedUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError("Strip failed: " + (e?.message || e));
    }
  };

  const download = () => {
    if (!cleanedBlob || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const ext = file.type === "image/png" ? "png" : "jpg";
    const a = document.createElement("a");
    a.href = cleanedUrl;
    a.download = `${base}.clean.${ext}`;
    a.click();
  };

  // Flatten metadata into (key, value, risk) rows
  const rows = meta ? Object.entries(meta).map(([k, v]) => ({
    key: k, value: formatValue(v), risk: classify(k),
  })).sort((a, b) => {
    // Risky rows first
    if (a.risk && !b.risk) return -1;
    if (!a.risk && b.risk) return 1;
    return a.key.localeCompare(b.key);
  }) : [];

  const risks = rows.filter((r) => r.risk);

  const panel = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "var(--bg-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  return (
    <>
      <SEO
        title={t("tools.exif.name")}
        description={t("tools.exif.desc")}
        path="/tools/exif"
        structuredData={schema.softwareApp({
          name: "OneTools EXIF",
          description: t("tools.exif.desc"),
          url: "https://onetools.dev/tools/exif",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.exif.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · Privacy</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.exif.desc")}
          </p>
        </div>

        <input ref={inputRef} type="file" accept="image/*"
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
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {t("tools.exif.dropHere")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.exif.hint")}
            </div>
          </div>
        ) : (
          <>
            {/* Warning banner when risky metadata present */}
            {risks.length > 0 && (
              <div style={{
                marginTop: 24, padding: "14px 18px",
                borderRadius: "var(--radius)",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.35)",
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#a76200", marginBottom: 4 }}>
                    {t("tools.exif.riskTitle", { n: risks.length })}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#7c4a00", lineHeight: 1.55 }}>
                    {t("tools.exif.riskDesc")}
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding: "20px 0 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                  {formatSize(file.size)} · {rows.length} {t("tools.exif.fields")}
                </div>
              </div>
              <button onClick={reset}
                style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                {t("tools.exif.replace")}
              </button>
              <button onClick={stripExif}
                style={{ padding: "8px 18px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--gradient-brand)", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 14px rgba(91,91,245,0.35)" }}>
                ✦ {t("tools.exif.strip")}
              </button>
              {cleanedBlob && (
                <button onClick={download}
                  style={{ padding: "8px 18px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 14px rgba(10,11,16,0.2)" }}>
                  ⬇ {t("tools.exif.download")}
                </button>
              )}
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12, paddingBottom: 20 }}>
              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.exif.preview")}</span>
                  {cleanedBlob && <span style={{ color: "var(--green)", fontSize: 11 }}>✓ {t("tools.exif.stripped")}</span>}
                </div>
                <div style={{ padding: 16, minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)" }}>
                  <img src={cleanedUrl || preview} alt="" style={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain" }} />
                </div>
              </div>

              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.exif.metadataLabel")}</span>
                  <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                    {rows.length} {t("tools.exif.items")}
                  </span>
                </div>
                <div style={{ maxHeight: 560, overflow: "auto" }}>
                  {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      {t("tools.exif.parsing")}...
                    </div>
                  ) : rows.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      {t("tools.exif.noData")}
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} style={{
                            borderBottom: "1px solid var(--border-light)",
                            background: r.risk ? "rgba(245,158,11,0.06)" : "transparent",
                          }}>
                            <td style={{
                              padding: "8px 10px",
                              fontFamily: "var(--font-mono)", fontSize: 11,
                              color: r.risk ? "#a76200" : "var(--text-secondary)",
                              fontWeight: r.risk ? 600 : 400,
                              verticalAlign: "top", width: "38%",
                            }}>
                              {r.risk && <span style={{ marginRight: 4 }}>⚠️</span>}
                              {r.key}
                            </td>
                            <td style={{
                              padding: "8px 10px",
                              fontFamily: "var(--font-mono)", fontSize: 11.5,
                              color: "var(--text-primary)", verticalAlign: "top",
                              wordBreak: "break-all",
                            }}>
                              {r.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
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
              ℹ︎ {t("tools.exif.privacyTitle")}
            </div>
            {t("tools.exif.privacyDesc")}
          </div>
        )}
      </div>
    </>
  );
}
