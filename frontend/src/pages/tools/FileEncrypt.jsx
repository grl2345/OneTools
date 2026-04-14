import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";
import FaqSection from "../../components/FaqSection";

// ── Web Crypto helpers ────────────────────────────────
// File layout for encrypted output:
//   magic (4 bytes) = "OT1\0"
//   salt  (16 bytes)  — PBKDF2 salt
//   iv    (12 bytes)  — AES-GCM nonce
//   ct    (rest)      — ciphertext + tag
const MAGIC = new Uint8Array([0x4f, 0x54, 0x31, 0x00]); // "OT1\0"
const PBKDF2_ITERS = 210_000;

async function deriveKey(password, salt) {
  const pwKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERS, hash: "SHA-256" },
    pwKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptFile(file, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plain = new Uint8Array(await file.arrayBuffer());
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
  const out = new Uint8Array(MAGIC.length + salt.length + iv.length + ct.length);
  out.set(MAGIC, 0);
  out.set(salt, MAGIC.length);
  out.set(iv, MAGIC.length + salt.length);
  out.set(ct, MAGIC.length + salt.length + iv.length);
  return new Blob([out], { type: "application/octet-stream" });
}

async function decryptFile(file, password) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const magic = buf.slice(0, 4);
  if (magic[0] !== MAGIC[0] || magic[1] !== MAGIC[1] || magic[2] !== MAGIC[2] || magic[3] !== MAGIC[3]) {
    throw new Error("NOT_ENCRYPTED_BY_ONETOOLS");
  }
  const salt = buf.slice(4, 20);
  const iv = buf.slice(20, 32);
  const ct = buf.slice(32);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct).catch(() => {
    throw new Error("DECRYPT_FAILED");
  });
  return new Blob([plain]);
}

// Password strength (0-4)
function passwordStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 14) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^\w]/.test(pw)) s++;
  return Math.min(s, 4);
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`;
}

export default function FileEncrypt() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("encrypt");
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { blob, filename }
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const strength = passwordStrength(password);
  const strengthLabels = ["", t("tools.fileEncrypt.pwWeak"), t("tools.fileEncrypt.pwFair"), t("tools.fileEncrypt.pwGood"), t("tools.fileEncrypt.pwStrong")];
  const strengthColors = ["#d1d5db", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  const reset = () => {
    setFile(null); setPassword(""); setConfirmPw("");
    setResult(null); setError(null); setWorking(false);
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const run = async () => {
    if (!file || !password || working) return;
    if (mode === "encrypt" && password !== confirmPw) {
      setError(t("tools.fileEncrypt.pwMismatch"));
      return;
    }
    setError(null);
    setResult(null);
    setWorking(true);
    try {
      if (mode === "encrypt") {
        const blob = await encryptFile(file, password);
        setResult({ blob, filename: `${file.name}.enc` });
      } else {
        const blob = await decryptFile(file, password);
        // Strip .enc if present
        const name = file.name.replace(/\.enc$/i, "") || `${file.name}.decrypted`;
        setResult({ blob, filename: name });
      }
    } catch (e) {
      if (e.message === "NOT_ENCRYPTED_BY_ONETOOLS")
        setError(t("tools.fileEncrypt.notOurFile"));
      else if (e.message === "DECRYPT_FAILED")
        setError(t("tools.fileEncrypt.wrongPassword"));
      else
        setError(e?.message || "Operation failed");
    } finally {
      setWorking(false);
    }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url; a.download = result.filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const generatePassword = () => {
    const alphabet =
      "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    const arr = crypto.getRandomValues(new Uint8Array(20));
    const out = Array.from(arr, (b) => alphabet[b % alphabet.length]).join("");
    setPassword(out); setConfirmPw(out); setShowPw(true);
  };

  return (
    <>
      <SEO
        title={t("tools.fileEncrypt.name")}
        description={t("tools.fileEncrypt.desc")}
        path="/tools/file-encrypt"
        structuredData={schema.softwareApp({
          name: "OneTools File Encrypt",
          description: t("tools.fileEncrypt.desc"),
          url: "https://onetools.dev/tools/file-encrypt",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
              {t("tools.fileEncrypt.name")}
              <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · AES-256</span>
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
              {t("tools.fileEncrypt.desc")}
            </p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 999,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)",
            color: "var(--green)", fontSize: 11.5, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            {t("tools.fileEncrypt.badge")}
          </span>
        </div>

        {/* Mode */}
        <div style={{ padding: "24px 0 14px" }}>
          <div style={{ display: "inline-flex", gap: 4, padding: 3, background: "var(--bg-subtle)", borderRadius: 999 }}>
            {["encrypt", "decrypt"].map((m) => (
              <button key={m} onClick={() => { setMode(m); reset(); }}
                style={{
                  padding: "6px 18px", borderRadius: 999, border: "none",
                  background: mode === m ? "var(--text-primary)" : "transparent",
                  color: mode === m ? "#fff" : "var(--text-secondary)",
                  fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                }}>
                {t("tools.fileEncrypt.mode_" + m)}
              </button>
            ))}
          </div>
        </div>

        <input ref={inputRef} type="file"
          onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

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
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              {mode === "encrypt" ? t("tools.fileEncrypt.dropToEncrypt") : t("tools.fileEncrypt.dropToDecrypt")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("tools.fileEncrypt.hint")}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {mode === "encrypt" ? "🔒" : "🔓"} {file.name}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                  {formatSize(file.size)}
                </div>
              </div>
              <button onClick={reset}
                style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "#ffffff", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                {t("tools.fileEncrypt.replace")}
              </button>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-md)", padding: 20, marginBottom: 16 }}>
              <label style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                {t("tools.fileEncrypt.password")}
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type={showPw ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("tools.fileEncrypt.passwordPlaceholder")}
                  autoComplete="new-password"
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-strong)", fontSize: 14,
                    fontFamily: showPw ? "var(--font-mono)" : "inherit",
                    background: "#fafbfc", color: "var(--text-primary)",
                  }} />
                <button onClick={() => setShowPw(!showPw)}
                  style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "#ffffff", color: "var(--text-secondary)", fontSize: 12.5 }}>
                  {showPw ? "🙈" : "👁"}
                </button>
                {mode === "encrypt" && (
                  <button onClick={generatePassword}
                    style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "#ffffff", color: "var(--brand)", fontSize: 12, fontWeight: 600 }}>
                    🎲 {t("tools.fileEncrypt.generate")}
                  </button>
                )}
              </div>

              {/* Strength meter (encrypt only) */}
              {mode === "encrypt" && password && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: n <= strength ? strengthColors[strength] : "#e5e7eb",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColors[strength], fontWeight: 600 }}>
                    {strengthLabels[strength]}
                  </div>
                </div>
              )}

              {mode === "encrypt" && (
                <>
                  <label style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                    {t("tools.fileEncrypt.confirmPassword")}
                  </label>
                  <input type={showPw ? "text" : "password"}
                    value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder={t("tools.fileEncrypt.confirmPlaceholder")}
                    autoComplete="new-password"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)",
                      border: `1px solid ${confirmPw && password !== confirmPw ? "var(--red)" : "var(--border-strong)"}`,
                      fontSize: 14, fontFamily: showPw ? "var(--font-mono)" : "inherit",
                      background: "#fafbfc",
                    }} />
                </>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={run}
                  disabled={!file || !password || working || (mode === "encrypt" && password !== confirmPw)}
                  style={{
                    flex: 1, padding: "10px 20px", borderRadius: "var(--radius-sm)", border: "none",
                    background: !file || !password || working || (mode === "encrypt" && password !== confirmPw)
                      ? "#d8d8e0" : "var(--gradient-brand)",
                    color: "#fff", fontSize: 13.5, fontWeight: 600,
                    cursor: working ? "wait" : "pointer",
                  }}>
                  {working ? "..." : mode === "encrypt" ? "🔒 " + t("tools.fileEncrypt.encryptAction") : "🔓 " + t("tools.fileEncrypt.decryptAction")}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
                {error}
              </div>
            )}

            {result && (
              <div style={{
                padding: "16px 18px", borderRadius: "var(--radius)",
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 30,
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
                <button onClick={download}
                  style={{ padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--text-primary)", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                  ⬇ {t("tools.fileEncrypt.download")}
                </button>
              </div>
            )}
          </>
        )}

        <div style={{
          marginBottom: 72, padding: "16px 18px",
          borderRadius: "var(--radius)",
          background: "rgba(91,91,245,0.05)",
          border: "1px solid rgba(91,91,245,0.18)",
          fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65,
        }}>
          <div style={{ fontWeight: 600, color: "var(--brand)", marginBottom: 4 }}>
            🔐 {t("tools.fileEncrypt.privacyTitle")}
          </div>
          {t("tools.fileEncrypt.privacyDesc")}
        </div>

        <FaqSection
          title={t("faq.title")}
          items={t("faq.fileEncrypt", { returnObjects: true })}
          path="/tools/file-encrypt"
        />
      </div>
    </>
  );
}
