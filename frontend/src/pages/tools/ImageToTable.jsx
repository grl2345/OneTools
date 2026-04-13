import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";
import { aiVision } from "../../api/client";
import { fileToDataUrl, toCsv } from "../../utils/image";

export default function ImageToTable() {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError(t("tools.imageToTable.notImage")); return; }
    setError(null); setResult(null); setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const run = async () => {
    if (!file || loading) return;
    setError(null); setResult(null); setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file, 1800, 0.88);
      const r = await aiVision("table", dataUrl, i18n.language || "zh");
      setResult(r);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "AI call failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!result) return;
    const rows = [];
    if (result.headers?.length) rows.push(result.headers);
    if (result.rows?.length) rows.push(...result.rows);
    const csv = "\uFEFF" + toCsv(rows); // BOM for Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "table.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyCsv = () => {
    if (!result) return;
    const rows = [];
    if (result.headers?.length) rows.push(result.headers);
    if (result.rows?.length) rows.push(...result.rows);
    navigator.clipboard.writeText(toCsv(rows)).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setResult(null); setError(null);
  };

  const panel = { background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "#fafbfc", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  return (
    <>
      <SEO
        title={t("tools.imageToTable.name")}
        description={t("tools.imageToTable.desc")}
        path="/tools/image-to-table"
        structuredData={schema.softwareApp({
          name: "OneTools AI Image to Table",
          description: t("tools.imageToTable.desc"),
          url: "https://onetools.dev/tools/image-to-table",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.imageToTable.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> ·AI</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.imageToTable.desc")}
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
              background: dragging ? "rgba(91,91,245,0.06)" : "#ffffff",
              cursor: "pointer", boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {t("tools.imageToTable.dropHere")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.imageToTable.hint")}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: "24px 0 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }} />
              <button onClick={reset}
                style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "#ffffff", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                {t("tools.imageToTable.replace")}
              </button>
              <button onClick={run} disabled={loading}
                style={{ padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none", background: loading ? "#d8d8e0" : "var(--gradient-brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", boxShadow: loading ? "none" : "0 4px 14px rgba(91,91,245,0.35)" }}>
                {loading ? t("tools.imageToTable.extracting") : "✦ " + t("tools.imageToTable.extract")}
              </button>
              {result && (
                <>
                  <button onClick={copyCsv}
                    style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: copied ? "rgba(16,185,129,0.1)" : "#ffffff", color: copied ? "var(--green)" : "var(--text-secondary)", fontSize: 12.5, fontWeight: 500 }}>
                    {copied ? "✓ " + t("tools.imageToTable.copied") : "⎘ CSV"}
                  </button>
                  <button onClick={downloadCsv}
                    style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--text-primary)", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>
                    ⬇ CSV
                  </button>
                </>
              )}
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 12, paddingBottom: 20 }}>
              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.imageToTable.original")}</span>
                </div>
                <div style={{ padding: 16, minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f7" }}>
                  <img src={preview} alt="" style={{ maxWidth: "100%", maxHeight: 520, objectFit: "contain" }} />
                </div>
              </div>

              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.imageToTable.extractedLabel")}</span>
                  {result?.notes && <span style={{ color: "var(--text-faint)", fontSize: 11 }}>
                    {result.notes}
                  </span>}
                </div>
                <div style={{ overflow: "auto", maxHeight: 560 }}>
                  {result ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                      {result.headers?.length > 0 && (
                        <thead>
                          <tr style={{ background: "#fafbfc", borderBottom: "1px solid var(--border)" }}>
                            {result.headers.map((h, i) => (
                              <th key={i} style={{
                                textAlign: "left", padding: "10px 12px",
                                fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
                                textTransform: "uppercase", letterSpacing: 0.5,
                                position: "sticky", top: 0, background: "#fafbfc",
                              }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {result.rows?.map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: "1px solid var(--border-light)", background: ri % 2 ? "rgba(17,24,39,0.015)" : "transparent" }}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ padding: "8px 12px", color: "var(--text-primary)", verticalAlign: "top", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      {loading ? t("tools.imageToTable.extracting") + "..." : t("tools.imageToTable.waiting")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
