import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";
import { aiSummarizePdf } from "../../api/client";

// Lazy load pdfjs-dist so the ~400KB bundle only ships when user visits here
let pdfjsPromise = null;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
      // Point at the matching worker from the same installed version
      const workerUrl = (
        await import("pdfjs-dist/build/pdf.worker.mjs?url")
      ).default;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjsLib;
    })();
  }
  return pdfjsPromise;
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB"];
  let i = 0,
    v = bytes;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`;
}

export default function PdfSummary() {
  const { t, i18n } = useTranslation();

  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [extractStage, setExtractStage] = useState(null); // 'extracting' | null
  const [extractProgress, setExtractProgress] = useState(0);

  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const extract = async (f) => {
    setExtractStage("extracting");
    setExtractProgress(0);
    setExtractedText("");
    setPageCount(0);
    try {
      const pdfjs = await getPdfjs();
      const buf = await f.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      setPageCount(pdf.numPages);
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text +=
          content.items.map((item) => ("str" in item ? item.str : "")).join(" ") +
          "\n\n";
        setExtractProgress(Math.round((i / pdf.numPages) * 100));
      }
      setExtractedText(text.trim());
    } catch (e) {
      setError(
        (i18n.language === "zh" ? "PDF 解析失败：" : "PDF parse failed: ") +
          (e?.message || e)
      );
    } finally {
      setExtractStage(null);
    }
  };

  const handleFile = async (f) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      setError(t("tools.pdfSummary.notPdf"));
      return;
    }
    setError(null);
    setSummary(null);
    setFile(f);
    await extract(f);
  };

  const summarize = async () => {
    if (!extractedText || summarizing) return;
    setError(null);
    setSummary(null);
    setSummarizing(true);
    try {
      const r = await aiSummarizePdf(extractedText, i18n.language || "zh");
      setSummary(r);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "AI call failed");
    } finally {
      setSummarizing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setExtractedText("");
    setPageCount(0);
    setSummary(null);
    setError(null);
    setExtractStage(null);
    setExtractProgress(0);
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
    background: "#fafbfc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    letterSpacing: -0.1,
  };

  return (
    <>
      <SEO
        title={t("tools.pdfSummary.name")}
        description={t("tools.pdfSummary.desc")}
        path="/tools/pdf-summary"
        structuredData={schema.softwareApp({
          name: "OneTools AI PDF Summary",
          description: t("tools.pdfSummary.desc"),
          url: "https://onetools.dev/tools/pdf-summary",
        })}
      />
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div style={{ padding: "56px 0 0" }}>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: -1.4,
              lineHeight: 1.08,
            }}
          >
            {t("tools.pdfSummary.name")}
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {" "}·AI
            </span>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginTop: 8,
              fontWeight: 450,
            }}
          >
            {t("tools.pdfSummary.desc")}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={{ display: "none" }}
        />

        {!file ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            style={{
              marginTop: 28,
              padding: "80px 24px",
              textAlign: "center",
              borderRadius: "var(--radius)",
              border: `2px dashed ${
                dragging ? "var(--brand)" : "var(--border-strong)"
              }`,
              background: dragging ? "rgba(91,91,245,0.06)" : "#ffffff",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              {t("tools.pdfSummary.dropHere")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.pdfSummary.hint")}
            </div>
          </div>
        ) : (
          <>
            {/* Meta bar */}
            <div
              style={{
                padding: "20px 0 14px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  📄 {file.name}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    marginTop: 2,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatSize(file.size)} · {pageCount}{" "}
                  {t("tools.pdfSummary.pages")} · {extractedText.length}{" "}
                  {t("tools.pdfSummary.chars")}
                </div>
              </div>
              <button
                onClick={reset}
                style={{
                  padding: "7px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)",
                  background: "#ffffff",
                  color: "var(--text-primary)",
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              >
                {t("tools.pdfSummary.replace")}
              </button>
              <button
                onClick={summarize}
                disabled={!extractedText || summarizing || extractStage}
                style={{
                  padding: "8px 20px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background:
                    !extractedText || summarizing || extractStage
                      ? "#d8d8e0"
                      : "var(--gradient-brand)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    !extractedText || summarizing || extractStage
                      ? "not-allowed"
                      : "pointer",
                  boxShadow:
                    !extractedText || summarizing || extractStage
                      ? "none"
                      : "0 4px 14px rgba(91,91,245,0.35)",
                }}
              >
                {summarizing
                  ? t("tools.pdfSummary.summarizing")
                  : "✦ " + t("tools.pdfSummary.summarize")}
              </button>
            </div>

            {extractStage && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(91,91,245,0.05)",
                  border: "1px solid rgba(91,91,245,0.18)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--brand)",
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {t("tools.pdfSummary.extracting")} {extractProgress}%
                </div>
                <div
                  style={{
                    height: 5,
                    background: "rgba(91,91,245,0.15)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${extractProgress || 3}%`,
                      background: "var(--gradient-brand)",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  fontSize: 12.5,
                  color: "var(--red)",
                }}
              >
                {error}
              </div>
            )}

            {/* Summary result */}
            {summary && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: 12,
                  paddingBottom: 20,
                }}
              >
                <div style={panel}>
                  <div style={panelHeader}>
                    <span>{t("tools.pdfSummary.summaryLabel")}</span>
                    <span
                      style={{
                        color: "var(--text-faint)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {summary.doc_type}
                    </span>
                  </div>
                  <div style={{ padding: "16px 18px" }}>
                    {summary.title && (
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          letterSpacing: -0.3,
                          marginBottom: 10,
                        }}
                      >
                        {summary.title}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-secondary)",
                        lineHeight: 1.7,
                        marginBottom: summary.key_points?.length ? 16 : 0,
                      }}
                    >
                      {summary.summary}
                    </div>

                    {summary.key_points?.length > 0 && (
                      <>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "var(--text-muted)",
                            fontWeight: 700,
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          {t("tools.pdfSummary.keyPoints")}
                        </div>
                        <ul
                          style={{
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                          }}
                        >
                          {summary.key_points.map((kp, i) => (
                            <li
                              key={i}
                              style={{
                                padding: "10px 0",
                                borderBottom: "1px solid var(--border-light)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                  marginBottom: 2,
                                }}
                              >
                                <span
                                  style={{
                                    color: "var(--brand)",
                                    marginRight: 8,
                                  }}
                                >
                                  ▸
                                </span>
                                {kp.point}
                              </div>
                              {kp.detail && (
                                <div
                                  style={{
                                    fontSize: 12.5,
                                    color: "var(--text-muted)",
                                    lineHeight: 1.55,
                                    paddingLeft: 18,
                                  }}
                                >
                                  {kp.detail}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                <div style={panel}>
                  <div style={panelHeader}>
                    <span>{t("tools.pdfSummary.entities")}</span>
                  </div>
                  <div
                    style={{
                      padding: 16,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {summary.entities?.length > 0 ? (
                      summary.entities.map((e, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 999,
                            background: "rgba(91,91,245,0.08)",
                            color: "var(--brand)",
                            fontSize: 12,
                            fontWeight: 500,
                            border: "1px solid rgba(91,91,245,0.22)",
                          }}
                        >
                          {e}
                        </span>
                      ))
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        {t("tools.pdfSummary.noEntities")}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid var(--border-light)",
                      padding: "12px 16px",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {t("tools.pdfSummary.originalLabel")}
                    </div>
                    <div
                      style={{
                        maxHeight: 180,
                        overflow: "auto",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11.5,
                        background: "#fafbfc",
                        padding: 10,
                        borderRadius: 6,
                      }}
                    >
                      {extractedText.slice(0, 1500)}
                      {extractedText.length > 1500 && "..."}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Raw text preview (shown before summarize) */}
            {!summary && extractedText && !extractStage && (
              <div style={{ ...panel, marginBottom: 24 }}>
                <div style={panelHeader}>
                  <span>{t("tools.pdfSummary.extractedLabel")}</span>
                </div>
                <div
                  style={{
                    maxHeight: 400,
                    overflow: "auto",
                    padding: 16,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {extractedText.slice(0, 4000)}
                  {extractedText.length > 4000 &&
                    `\n\n... (${
                      extractedText.length - 4000
                    } ${t("tools.pdfSummary.moreChars")})`}
                </div>
              </div>
            )}
          </>
        )}

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
              lineHeight: 1.65,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "var(--brand)",
                marginBottom: 4,
              }}
            >
              ℹ︎ {t("tools.pdfSummary.privacyTitle")}
            </div>
            {t("tools.pdfSummary.privacyDesc")}
          </div>
        )}
      </div>
    </>
  );
}
