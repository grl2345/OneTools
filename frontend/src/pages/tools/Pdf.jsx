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

/**
 * Parse a page range like "1-3,5,7-9" into a 0-indexed array.
 * Returns null if invalid. totalPages is 1-indexed count.
 */
function parseRange(spec, totalPages) {
  if (!spec?.trim()) return null;
  const parts = spec.split(",").map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (/^\d+$/.test(p)) {
      const n = parseInt(p, 10);
      if (n < 1 || n > totalPages) return null;
      out.push(n - 1);
    } else {
      const m = /^(\d+)-(\d+)$/.exec(p);
      if (!m) return null;
      const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      if (a < 1 || b > totalPages || a > b) return null;
      for (let i = a; i <= b; i++) out.push(i - 1);
    }
  }
  return out;
}

export default function Pdf() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("merge"); // 'merge' | 'extract' | 'split'
  const [files, setFiles] = useState([]); // for merge
  const [file, setFile] = useState(null); // for extract / split
  const [pageCount, setPageCount] = useState(0);
  const [rangeSpec, setRangeSpec] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { blob, url, filename }
  const [splitResults, setSplitResults] = useState([]); // [{blob,url,filename}]
  const inputRef = useRef(null);

  const reset = () => {
    setFiles([]); setFile(null); setPageCount(0); setRangeSpec("");
    setResult(null); setSplitResults([]); setError(null); setWorking(false);
  };

  const readPageCount = async (f) => {
    const { PDFDocument } = await import("pdf-lib");
    const buf = await f.arrayBuffer();
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    return doc.getPageCount();
  };

  const handleFiles = async (flist) => {
    if (!flist?.length) return;
    const arr = Array.from(flist).filter((f) =>
      f.type === "application/pdf" || /\.pdf$/i.test(f.name)
    );
    if (!arr.length) { setError(t("tools.pdf.notPdf")); return; }
    setError(null);
    if (mode === "merge") {
      setFiles([...files, ...arr]);
    } else {
      const f = arr[0];
      setFile(f);
      try {
        setPageCount(await readPageCount(f));
      } catch (e) {
        setError((e?.message || "Parse failed"));
      }
    }
  };

  const removeFile = (i) => {
    const next = files.slice();
    next.splice(i, 1);
    setFiles(next);
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setWorking(true); setError(null); setResult(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const f of files) {
        const buf = await f.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResult({ blob, url: URL.createObjectURL(blob), filename: "merged.pdf" });
    } catch (e) {
      setError(e?.message || "Merge failed");
    } finally {
      setWorking(false);
    }
  };

  const extractPages = async () => {
    if (!file) return;
    const idx = parseRange(rangeSpec, pageCount);
    if (!idx) { setError(t("tools.pdf.invalidRange")); return; }
    setWorking(true); setError(null); setResult(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, idx);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const base = file.name.replace(/\.[^.]+$/, "");
      setResult({ blob, url: URL.createObjectURL(blob), filename: `${base}.extract.pdf` });
    } catch (e) {
      setError(e?.message || "Extract failed");
    } finally {
      setWorking(false);
    }
  };

  const splitEachPage = async () => {
    if (!file) return;
    setWorking(true); setError(null); setSplitResults([]);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const base = file.name.replace(/\.[^.]+$/, "");
      const outs = [];
      for (let i = 0; i < src.getPageCount(); i++) {
        const doc = await PDFDocument.create();
        const [page] = await doc.copyPages(src, [i]);
        doc.addPage(page);
        const bytes = await doc.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        outs.push({
          blob, url: URL.createObjectURL(blob),
          filename: `${base}.p${String(i + 1).padStart(3, "0")}.pdf`,
        });
      }
      setSplitResults(outs);
    } catch (e) {
      setError(e?.message || "Split failed");
    } finally {
      setWorking(false);
    }
  };

  const download = (r) => {
    const a = document.createElement("a");
    a.href = r.url; a.download = r.filename; a.click();
  };

  const downloadAll = async () => {
    for (const r of splitResults) {
      download(r);
      await new Promise((res) => setTimeout(res, 120));
    }
  };

  const panel = { background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "#fafbfc", letterSpacing: -0.1, display: "flex", justifyContent: "space-between", alignItems: "center" };

  return (
    <>
      <SEO
        title={t("tools.pdf.name")}
        description={t("tools.pdf.desc")}
        path="/tools/pdf"
        structuredData={schema.softwareApp({
          name: "OneTools PDF",
          description: t("tools.pdf.desc"),
          url: "https://onetools.dev/tools/pdf",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.pdf.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · Local</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.pdf.desc")}
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ padding: "24px 0 14px" }}>
          <div style={{ display: "inline-flex", gap: 4, padding: 3, background: "var(--bg-subtle)", borderRadius: 999 }}>
            {["merge", "extract", "split"].map((m) => (
              <button key={m} onClick={() => { setMode(m); reset(); }}
                style={{
                  padding: "6px 14px", borderRadius: 999, border: "none",
                  background: mode === m ? "var(--text-primary)" : "transparent",
                  color: mode === m ? "#fff" : "var(--text-secondary)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                {t("tools.pdf.mode_" + m)}
              </button>
            ))}
          </div>
        </div>

        <input ref={inputRef} type="file" accept="application/pdf,.pdf"
          multiple={mode === "merge"}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          style={{ display: "none" }} />

        {/* Merge UI */}
        {mode === "merge" && (
          <>
            {files.length === 0 ? (
              <div onClick={() => inputRef.current?.click()}
                style={{
                  padding: "80px 24px", textAlign: "center",
                  borderRadius: "var(--radius)",
                  border: "2px dashed var(--border-strong)",
                  background: "#ffffff", cursor: "pointer", boxShadow: "var(--shadow-sm)",
                }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📑</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {t("tools.pdf.mergeDropHere")}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {t("tools.pdf.mergeHint")}
                </div>
              </div>
            ) : (
              <>
                <div style={{ ...panel, marginBottom: 14 }}>
                  <div style={panelHeader}>
                    <span>{t("tools.pdf.filesList")} · {files.length}</span>
                    <button onClick={() => inputRef.current?.click()}
                      style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "#ffffff", color: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }}>
                      + {t("tools.pdf.addMore")}
                    </button>
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {files.map((f, i) => (
                      <li key={i} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-light)", display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", width: 24 }}>
                          {i + 1}.
                        </span>
                        <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {formatSize(f.size)}
                        </span>
                        <button onClick={() => removeFile(i)}
                          style={{ padding: "2px 8px", borderRadius: 999, border: "1px solid var(--border)", background: "#ffffff", color: "var(--text-muted)", fontSize: 11 }}>
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={reset}
                    style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "#ffffff", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                    {t("tools.pdf.clear")}
                  </button>
                  <button onClick={mergePdfs} disabled={files.length < 2 || working}
                    style={{
                      padding: "8px 22px", borderRadius: "var(--radius-sm)", border: "none",
                      background: files.length < 2 || working ? "#d8d8e0" : "var(--gradient-brand)",
                      color: "#fff", fontSize: 13, fontWeight: 600,
                      boxShadow: files.length < 2 || working ? "none" : "0 4px 14px rgba(91,91,245,0.35)",
                      cursor: files.length < 2 || working ? "not-allowed" : "pointer",
                    }}>
                    {working ? t("tools.pdf.merging") : "✦ " + t("tools.pdf.mergeAction", { n: files.length })}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Extract / Split UI */}
        {mode !== "merge" && (
          <>
            {!file ? (
              <div onClick={() => inputRef.current?.click()}
                style={{
                  padding: "80px 24px", textAlign: "center",
                  borderRadius: "var(--radius)",
                  border: "2px dashed var(--border-strong)",
                  background: "#ffffff", cursor: "pointer", boxShadow: "var(--shadow-sm)",
                }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{mode === "extract" ? "📄" : "✂︎"}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {mode === "extract" ? t("tools.pdf.extractDropHere") : t("tools.pdf.splitDropHere")}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {t("tools.pdf.oneFileHint")}
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: "0 0 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>📄 {file.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                      {formatSize(file.size)} · {pageCount} {t("tools.pdf.pages")}
                    </div>
                  </div>
                  <button onClick={reset}
                    style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "#ffffff", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                    {t("tools.pdf.replace")}
                  </button>
                </div>

                {mode === "extract" && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 14, flexWrap: "wrap" }}>
                    <input
                      value={rangeSpec}
                      onChange={(e) => setRangeSpec(e.target.value)}
                      placeholder={t("tools.pdf.rangePlaceholder")}
                      style={{
                        flex: 1, minWidth: 260,
                        padding: "10px 14px", borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-strong)",
                        background: "#ffffff", fontSize: 13.5,
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                    <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                      {t("tools.pdf.rangeHint")}
                    </span>
                    <button onClick={extractPages} disabled={working || !rangeSpec.trim()}
                      style={{
                        padding: "10px 22px", borderRadius: "var(--radius-sm)", border: "none",
                        background: working || !rangeSpec.trim() ? "#d8d8e0" : "var(--gradient-brand)",
                        color: "#fff", fontSize: 13, fontWeight: 600,
                        boxShadow: working || !rangeSpec.trim() ? "none" : "0 4px 14px rgba(91,91,245,0.35)",
                      }}>
                      {working ? t("tools.pdf.extracting") : "✦ " + t("tools.pdf.extractAction")}
                    </button>
                  </div>
                )}

                {mode === "split" && (
                  <div style={{ paddingBottom: 14 }}>
                    <button onClick={splitEachPage} disabled={working}
                      style={{
                        padding: "10px 22px", borderRadius: "var(--radius-sm)", border: "none",
                        background: working ? "#d8d8e0" : "var(--gradient-brand)",
                        color: "#fff", fontSize: 13, fontWeight: 600,
                        boxShadow: working ? "none" : "0 4px 14px rgba(91,91,245,0.35)",
                      }}>
                      {working ? t("tools.pdf.splitting") : "✦ " + t("tools.pdf.splitAction", { n: pageCount })}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {error && (
          <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
            {error}
          </div>
        )}

        {/* Single-result (merge / extract) */}
        {result && (
          <div style={{
            padding: "16px 18px", borderRadius: "var(--radius)",
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 20,
          }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--green)" }}>
                {result.filename}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {formatSize(result.blob.size)}
              </div>
            </div>
            <button onClick={() => download(result)}
              style={{ padding: "8px 18px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--text-primary)", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 14px rgba(10,11,16,0.2)" }}>
              ⬇ {t("tools.pdf.download")}
            </button>
          </div>
        )}

        {/* Multi-result (split) */}
        {splitResults.length > 0 && (
          <div style={{ ...panel, marginBottom: 30 }}>
            <div style={panelHeader}>
              <span>{t("tools.pdf.splitResults")} · {splitResults.length}</span>
              <button onClick={downloadAll}
                style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "var(--text-primary)", color: "#fff", fontSize: 11.5, fontWeight: 600 }}>
                ⬇ {t("tools.pdf.downloadAll")}
              </button>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 400, overflow: "auto" }}>
              {splitResults.map((r, i) => (
                <li key={i} style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-light)", display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ flex: 1, fontSize: 12.5, fontFamily: "var(--font-mono)" }}>{r.filename}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {formatSize(r.blob.size)}
                  </span>
                  <button onClick={() => download(r)}
                    style={{ padding: "3px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "#ffffff", color: "var(--text-secondary)", fontSize: 11 }}>
                    ⬇
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
