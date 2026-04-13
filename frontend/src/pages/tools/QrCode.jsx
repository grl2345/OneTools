import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

// Heuristic-classify decoded QR content
function classifyQr(text) {
  const t = text.trim();
  if (/^https?:\/\//i.test(t)) return { kind: "url", label: "URL" };
  if (/^WIFI:/i.test(t)) return { kind: "wifi", label: "Wi-Fi" };
  if (/^BEGIN:VCARD/i.test(t)) return { kind: "vcard", label: "vCard" };
  if (/^mailto:/i.test(t)) return { kind: "email", label: "Email" };
  if (/^tel:/i.test(t)) return { kind: "phone", label: "Phone" };
  if (/^geo:/i.test(t)) return { kind: "geo", label: "Location" };
  if (/^(wepay|alipay|weixin):\/\//i.test(t)) return { kind: "payment", label: "支付" };
  if (/^otpauth:\/\//i.test(t)) return { kind: "otp", label: "TOTP 2FA" };
  return { kind: "text", label: "Text" };
}

function parseWifi(text) {
  // WIFI:T:WPA;S:SSID;P:pass;;
  const m = /^WIFI:T:([^;]*);S:([^;]*);(?:P:([^;]*);)?/i.exec(text);
  if (!m) return null;
  return { type: m[1] || "WPA", ssid: m[2] || "", password: m[3] || "" };
}

export default function QrCode() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("generate"); // 'generate' | 'scan'

  // Generate state
  const [text, setText] = useState("https://onetools.dev");
  const [ec, setEc] = useState("M"); // Error correction level L/M/Q/H
  const [size, setSize] = useState(512);
  const [fgColor, setFgColor] = useState("#0a0b10");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [genError, setGenError] = useState(null);

  // Scan state
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const scanInputRef = useRef(null);

  // Auto-regenerate on any input change
  useEffect(() => {
    if (mode !== "generate" || !text.trim()) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const qrcode = (await import("qrcode")).default || (await import("qrcode"));
        const dataUrl = await qrcode.toDataURL(text, {
          errorCorrectionLevel: ec,
          width: size,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
        });
        if (!cancelled) {
          setQrDataUrl(dataUrl);
          setGenError(null);
        }
      } catch (e) {
        if (!cancelled) setGenError(e?.message || "Generation failed");
      }
    })();
    return () => { cancelled = true; };
  }, [mode, text, ec, size, fgColor, bgColor]);

  const handleScanFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setScanError(t("tools.qrcode.notImage")); return; }
    setScanError(null); setScanResult(null);
    setScanFile(f);
    const url = URL.createObjectURL(f);
    setScanPreview(url);

    try {
      const jsQR = (await import("jsqr")).default;
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (!code) {
        setScanError(t("tools.qrcode.noQrFound"));
        return;
      }
      setScanResult({
        text: code.data,
        classification: classifyQr(code.data),
        wifi: parseWifi(code.data),
      });
    } catch (e) {
      setScanError(e?.message || "Scan failed");
    }
  };

  const downloadQr = (fmt) => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode.${fmt}`;
    a.click();
  };

  const copyResult = () => {
    if (!scanResult?.text) return;
    navigator.clipboard.writeText(scanResult.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const resetScan = () => {
    if (scanPreview) URL.revokeObjectURL(scanPreview);
    setScanFile(null); setScanPreview(null);
    setScanResult(null); setScanError(null);
  };

  const panel = { background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "#fafbfc", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  return (
    <>
      <SEO
        title={t("tools.qrcode.name")}
        description={t("tools.qrcode.desc")}
        path="/tools/qrcode"
        structuredData={schema.softwareApp({
          name: "OneTools QR Code",
          description: t("tools.qrcode.desc"),
          url: "https://onetools.dev/tools/qrcode",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.qrcode.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · QR</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.qrcode.desc")}
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ padding: "24px 0 14px" }}>
          <div style={{ display: "inline-flex", gap: 4, padding: 3, background: "var(--bg-subtle)", borderRadius: 999 }}>
            {["generate", "scan"].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  padding: "6px 16px", borderRadius: 999, border: "none",
                  background: mode === m ? "var(--text-primary)" : "transparent",
                  color: mode === m ? "#fff" : "var(--text-secondary)",
                  fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                }}>
                {t("tools.qrcode.mode_" + m)}
              </button>
            ))}
          </div>
        </div>

        {/* GENERATE */}
        {mode === "generate" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, paddingBottom: 30 }}>
            <div style={panel}>
              <div style={panelHeader}>{t("tools.qrcode.inputLabel")}</div>
              <div style={{ padding: 14 }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="https://example.com / 任意文本 / WIFI:T:WPA;S:ssid;P:password;;"
                  style={{
                    width: "100%", minHeight: 140,
                    padding: 14, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6,
                    background: "#fafbfc", color: "var(--text-primary)", resize: "vertical",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                      {t("tools.qrcode.errorCorrection")}
                    </label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["L", "M", "Q", "H"].map((l) => (
                        <button key={l} onClick={() => setEc(l)}
                          style={{
                            padding: "5px 10px", borderRadius: "var(--radius-sm)",
                            border: ec === l ? "1px solid var(--brand)" : "1px solid var(--border)",
                            background: ec === l ? "rgba(91,91,245,0.08)" : "#ffffff",
                            color: ec === l ? "var(--brand)" : "var(--text-secondary)",
                            fontSize: 12, fontWeight: 600, flex: 1,
                          }}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>
                      L 7% · M 15% · Q 25% · H 30%
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                      {t("tools.qrcode.size")}: {size}px
                    </label>
                    <input type="range" min={128} max={1024} step={64}
                      value={size} onChange={(e) => setSize(+e.target.value)}
                      style={{ width: "100%", accentColor: "var(--brand)" }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14, marginTop: 12, alignItems: "center" }}>
                  <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    {t("tools.qrcode.fgColor")}
                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
                      style={{ width: 30, height: 26, padding: 0, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }} />
                  </label>
                  <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    {t("tools.qrcode.bgColor")}
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                      style={{ width: 30, height: 26, padding: 0, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }} />
                  </label>
                </div>
              </div>
            </div>

            <div style={panel}>
              <div style={panelHeader}>
                <span>{t("tools.qrcode.preview")}</span>
                {qrDataUrl && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => downloadQr("png")}
                      style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "#ffffff", color: "var(--text-secondary)", fontSize: 11 }}>
                      ⬇ PNG
                    </button>
                  </div>
                )}
              </div>
              <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, background: "#f3f4f7" }}>
                {genError ? (
                  <div style={{ color: "var(--red)", fontSize: 12.5 }}>{genError}</div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR" style={{ maxWidth: "100%", maxHeight: 400, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderRadius: 8 }} />
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("tools.qrcode.emptyPreview")}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCAN */}
        {mode === "scan" && (
          <>
            <input ref={scanInputRef} type="file" accept="image/*"
              onChange={(e) => handleScanFile(e.target.files?.[0])}
              style={{ display: "none" }} />

            {!scanFile ? (
              <div
                onClick={() => scanInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleScanFile(e.dataTransfer.files?.[0]); }}
                style={{
                  padding: "80px 24px", textAlign: "center",
                  borderRadius: "var(--radius)",
                  border: `2px dashed ${dragging ? "var(--brand)" : "var(--border-strong)"}`,
                  background: dragging ? "rgba(91,91,245,0.06)" : "#ffffff",
                  cursor: "pointer", boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {t("tools.qrcode.scanDropHere")}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {t("tools.qrcode.scanHint")}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingBottom: 30 }}>
                <div style={panel}>
                  <div style={panelHeader}>
                    <span>{t("tools.qrcode.originalImage")}</span>
                    <button onClick={resetScan}
                      style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "#ffffff", color: "var(--text-secondary)", fontSize: 11 }}>
                      {t("tools.qrcode.replace")}
                    </button>
                  </div>
                  <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f7", minHeight: 300 }}>
                    <img src={scanPreview} alt="" style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain" }} />
                  </div>
                </div>
                <div style={panel}>
                  <div style={panelHeader}>
                    <span>{t("tools.qrcode.decoded")}</span>
                    {scanResult?.classification && (
                      <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(91,91,245,0.08)", color: "var(--brand)", fontSize: 11, fontWeight: 600 }}>
                        {scanResult.classification.label}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 18, minHeight: 300 }}>
                    {scanError && <div style={{ color: "var(--red)", fontSize: 13 }}>{scanError}</div>}
                    {scanResult && (
                      <>
                        <div style={{
                          padding: 12, borderRadius: "var(--radius-sm)",
                          background: "#fafbfc", border: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.6,
                          wordBreak: "break-all", marginBottom: 12,
                        }}>
                          {scanResult.text}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                          <button onClick={copyResult}
                            style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid var(--border)", background: copied ? "rgba(16,185,129,0.1)" : "#ffffff", color: copied ? "var(--green)" : "var(--text-secondary)", fontSize: 12, fontWeight: 500 }}>
                            {copied ? "✓ " + t("tools.qrcode.copied") : t("tools.qrcode.copy")}
                          </button>
                          {scanResult.classification.kind === "url" && (
                            <a href={scanResult.text} target="_blank" rel="noopener noreferrer"
                              style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "#ffffff", color: "var(--brand)", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
                              ↗ {t("tools.qrcode.openUrl")}
                            </a>
                          )}
                        </div>

                        {scanResult.wifi && (
                          <div style={{ padding: 12, background: "rgba(91,91,245,0.05)", border: "1px solid rgba(91,91,245,0.2)", borderRadius: "var(--radius-sm)", fontSize: 12.5, lineHeight: 1.6 }}>
                            <div style={{ fontWeight: 600, color: "var(--brand)", marginBottom: 6 }}>📶 Wi-Fi 凭据</div>
                            <div><strong>SSID:</strong> {scanResult.wifi.ssid}</div>
                            <div><strong>{t("tools.qrcode.encryption")}:</strong> {scanResult.wifi.type}</div>
                            {scanResult.wifi.password && <div><strong>{t("tools.qrcode.password")}:</strong> {scanResult.wifi.password}</div>}
                          </div>
                        )}

                        {scanResult.classification.kind === "url" && /^https?:\/\/(bit\.ly|t\.cn|goo\.gl|tinyurl)/i.test(scanResult.text) && (
                          <div style={{ marginTop: 10, padding: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "#a76200" }}>
                            ⚠️ {t("tools.qrcode.shortUrlWarn")}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
