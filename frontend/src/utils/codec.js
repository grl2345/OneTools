// Small utility helpers shared by the codec / hash / UUID tools.
// Keeping them in one file so each tool page stays focused on UX.

// ── Base64 (Unicode-safe) ───────────────────────────────
export function encodeBase64(str) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

export function decodeBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

// ── HTML entities ───────────────────────────────────────
const HTML_ENCODE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};
const HTML_DECODE_MAP = Object.fromEntries(
  Object.entries(HTML_ENCODE_MAP).map(([k, v]) => [v, k])
);

export function encodeHtml(str) {
  return str.replace(/[&<>"'`=\/]/g, (ch) => HTML_ENCODE_MAP[ch]);
}

export function decodeHtml(str) {
  // Handle numeric references too (&#39; &#x27;)
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16))
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) => {
      const map = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
        nbsp: "\u00a0",
      };
      return map[name] || "";
    });
}

// ── Web Crypto SHA family ───────────────────────────────
export async function sha(algo, str) {
  const buf = await crypto.subtle.digest(
    algo,
    new TextEncoder().encode(str)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Hash identification (pattern-based) ────────────────
export function guessHashType(hash) {
  const s = hash.trim();
  if (!s) return null;
  if (/^\$2[aby]\$\d{2}\$[A-Za-z0-9.\/]{53}$/.test(s))
    return { type: "bcrypt", bits: 184 };
  if (/^\$argon2/.test(s)) return { type: "argon2", bits: "variable" };
  if (/^[a-f0-9]{32}$/i.test(s)) return { type: "MD5", bits: 128 };
  if (/^[a-f0-9]{40}$/i.test(s)) return { type: "SHA-1", bits: 160 };
  if (/^[a-f0-9]{64}$/i.test(s)) return { type: "SHA-256", bits: 256 };
  if (/^[a-f0-9]{96}$/i.test(s)) return { type: "SHA-384", bits: 384 };
  if (/^[a-f0-9]{128}$/i.test(s)) return { type: "SHA-512", bits: 512 };
  return null;
}

// ── UUID helpers ───────────────────────────────────────
export function uuidV4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // Fallback (very rare)
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** UUID v7 (timestamp-based, sortable, per RFC 9562 draft). */
export function uuidV7() {
  const ms = BigInt(Date.now());
  const rand = crypto.getRandomValues(new Uint8Array(10));
  const bytes = new Uint8Array(16);
  bytes[0] = Number((ms >> 40n) & 0xffn);
  bytes[1] = Number((ms >> 32n) & 0xffn);
  bytes[2] = Number((ms >> 24n) & 0xffn);
  bytes[3] = Number((ms >> 16n) & 0xffn);
  bytes[4] = Number((ms >> 8n) & 0xffn);
  bytes[5] = Number(ms & 0xffn);
  bytes[6] = 0x70 | (rand[0] & 0x0f); // version 7
  bytes[7] = rand[1];
  bytes[8] = 0x80 | (rand[2] & 0x3f); // variant
  bytes[9] = rand[3];
  for (let i = 10; i < 16; i++) bytes[i] = rand[i - 6];
  const hex = [...bytes]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function parseUUID(uuid) {
  const s = uuid.trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s))
    return null;
  const ver = parseInt(s[14], 16);
  const info = { version: ver, canonical: s };
  if (ver === 7) {
    // first 48 bits = unix ms
    const hex = s.replace(/-/g, "").slice(0, 12);
    const ms = parseInt(hex, 16);
    info.timestamp = new Date(ms);
  } else if (ver === 1) {
    // timestamp embedded, 60-bit count of 100ns intervals since 1582-10-15
    const hex = s.replace(/-/g, "");
    const timeLow = BigInt("0x" + hex.slice(0, 8));
    const timeMid = BigInt("0x" + hex.slice(8, 12));
    const timeHigh = BigInt("0x" + hex.slice(12, 16)) & 0x0fffn;
    const ticks = (timeHigh << 48n) | (timeMid << 32n) | timeLow;
    const ms =
      Number(ticks / 10000n) - 12219292800000; // gregorian → unix ms
    info.timestamp = new Date(ms);
    info.clockSeq = parseInt(hex.slice(16, 20), 16) & 0x3fff;
    info.node = hex.slice(20).match(/.{2}/g).join(":");
  }
  return info;
}

// ── JWT ──────────────────────────────────────────────────
function b64urlDecode(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function parseJWT(token) {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("Invalid JWT (need at least 2 parts)");
  const header = JSON.parse(b64urlDecode(parts[0]));
  const payload = JSON.parse(b64urlDecode(parts[1]));
  return { header, payload, signature: parts[2] || "" };
}
