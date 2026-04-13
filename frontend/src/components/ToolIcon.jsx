/**
 * A small, consistent icon set inspired by SF Symbols.
 * All icons are pure SVG, monochrome (currentColor), same stroke width,
 * and designed to feel like a single hand drew them — no emoji, no
 * multi-color, no tinted gradients.
 *
 * Add new icons by adding a key to ICONS and referencing it via <ToolIcon name="…">.
 */

const S = { size: 22, stroke: 1.6 };

const ICONS = {
  // ── Text & Data ──────────────────────────────
  json: (
    <>
      <path d="M8 4c-2 0-3 1-3 3v2c0 1.5-.8 2.3-2 2.5 1.2.2 2 1 2 2.5v2c0 2 1 3 3 3" />
      <path d="M16 4c2 0 3 1 3 3v2c0 1.5.8 2.3 2 2.5-1.2.2-2 1-2 2.5v2c0 2-1 3-3 3" />
    </>
  ),
  markdown: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 15V9l2.5 3L12 9v6" />
      <path d="M16 9v6M16 15l2-2M16 15l-2-2" />
    </>
  ),
  naming: (
    <>
      <path d="M5 18L9 6l4 12M6.5 14h5" />
      <path d="M15 12h4M15 16h4M19 18v-8" />
    </>
  ),
  cron: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  timestamp: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  flowchart: (
    <>
      <rect x="3" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="8.5" y="16" width="7" height="5" rx="1" />
      <path d="M6.5 8v4h11V8M12 12v4" />
    </>
  ),

  // ── Documents / OCR ──────────────────────────
  pdfSummary: (
    <>
      <path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M15 3v4h4M9 13h6M9 17h4" />
    </>
  ),
  ocr: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M8 13h8M8 17h5" />
    </>
  ),
  handwriting: (
    <>
      <path d="M3 20c3-1 7-6 11-10s6-5 7-3-3 5-5 7l-3 3" />
      <path d="M13 17l3 3M17 14l3 3" />
    </>
  ),
  imageToTable: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ),

  // ── Images ───────────────────────────────────
  removeBg: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
      <circle cx="12" cy="11" r="3" />
      <path d="M7 17c1.5-2 3-3 5-3s3.5 1 5 3" />
    </>
  ),
  removeWatermark: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M6 15c3-2 5-3 7-3s4 1 5 2" />
      <path d="M14 8l4 4M18 8l-4 4" />
    </>
  ),
  idPhoto: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 18c1.5-2 3-3 5-3s3.5 1 5 3" />
    </>
  ),
  upscale: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 14l3-3 2 2 3-3" />
      <path d="M16 10h2v2M18 8v4M18 8l-3 3" />
    </>
  ),
  imageCompress: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8l4 4-4 4M16 8l-4 4 4 4" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 100 18c1.5 0 2-.5 2-1.5s-.5-1.5-.5-2.5c0-1 .7-1.5 2-1.5h2a4 4 0 004-4c0-4.5-4-8.5-9.5-8.5z" />
      <circle cx="7" cy="11" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="15" cy="8" r="1" />
    </>
  ),
  exif: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16l5 5M11 8v3M11 13.5h.01" />
    </>
  ),

  // ── Audio / Video ────────────────────────────
  whisper: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 12a7 7 0 0014 0M12 19v3M8 22h8" />
    </>
  ),
  videoCompress: (
    <>
      <rect x="3" y="6" width="15" height="12" rx="2" />
      <path d="M18 10l3-2v8l-3-2M7 10l3 2-3 2" />
    </>
  ),
  videoToGif: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h2a2 2 0 012 2v2a2 2 0 01-2 2H7v-6zM13 9v6M16 9v6M16 12h2.5" />
    </>
  ),

  // ── Utilities ────────────────────────────────
  base64: (
    <>
      <path d="M7 5H5v14h2M17 5h2v14h-2" />
      <path d="M9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z" />
    </>
  ),
  qrcode: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM21 14v3M14 21v-3h3M21 21h-3" />
    </>
  ),
  fileEncrypt: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
      <circle cx="12" cy="16" r="1.2" />
    </>
  ),
  pdf: (
    <>
      <path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M15 3v4h4" />
      <path d="M9 13h2a2 2 0 010 4H9v-4zM13 13h2m0 0v4m0-2h1.5" />
    </>
  ),
};

export default function ToolIcon({ name, size = S.size, color = "currentColor" }) {
  const path = ICONS[name];
  if (!path) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={S.stroke} />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={S.stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}
