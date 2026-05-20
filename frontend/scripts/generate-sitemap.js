// Build-time sitemap generator. Reads the route table below and writes
// public/sitemap.xml so we never ship a sitemap that drifts from App.jsx.
// Run via `node scripts/generate-sitemap.js` (also wired into `npm run build`).

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://onetools.dev";

// Keep this in sync with src/App.jsx routes.
// priority: rough relevance hint to crawlers; tools higher than legal pages.
const ROUTES = [
  { path: "/", priority: 1.0, changefreq: "weekly" },

  // tools
  { path: "/tools/remove-watermark", priority: 0.9 },
  { path: "/tools/remove-bg",        priority: 0.9 },
  { path: "/tools/id-photo",         priority: 0.9 },
  { path: "/tools/image-compress",   priority: 0.9 },
  { path: "/tools/upscale",          priority: 0.9 },
  { path: "/tools/palette",          priority: 0.8 },
  { path: "/tools/file-encrypt",     priority: 0.8 },
  { path: "/tools/exif",             priority: 0.8 },
  { path: "/tools/pdf",              priority: 0.9 },
  { path: "/tools/pdf-summary",      priority: 0.9 },
  { path: "/tools/ocr",              priority: 0.9 },
  { path: "/tools/handwriting",      priority: 0.9 },
  { path: "/tools/image-to-table",   priority: 0.9 },
  { path: "/tools/video-compress",   priority: 0.9 },
  { path: "/tools/video-to-gif",     priority: 0.9 },
  { path: "/tools/whisper",          priority: 0.9 },
  { path: "/tools/json",             priority: 0.9 },
  { path: "/tools/markdown",         priority: 0.9 },
  { path: "/tools/naming",           priority: 0.8 },
  { path: "/tools/cron",             priority: 0.8 },
  { path: "/tools/timestamp",        priority: 0.9 },
  { path: "/tools/flowchart",        priority: 0.9 },
  { path: "/tools/base64",           priority: 0.8 },
  { path: "/tools/qrcode",           priority: 0.8 },

  // info pages
  { path: "/about",   priority: 0.5, changefreq: "monthly" },
  { path: "/privacy", priority: 0.3, changefreq: "monthly" },
  { path: "/terms",   priority: 0.3, changefreq: "monthly" },
];

const today = new Date().toISOString().slice(0, 10);

const body = ROUTES.map((r) => {
  const changefreq = r.changefreq || "weekly";
  return `  <url>
    <loc>${SITE}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`;
}).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, "..", "public", "sitemap.xml");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, xml, "utf8");
console.log(`sitemap.xml written: ${ROUTES.length} urls, lastmod=${today}`);
