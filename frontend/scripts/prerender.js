// Post-build prerender. After `vite build`, walks the route table and
// writes a per-route dist/<route>/index.html with the correct <title>,
// <meta>, canonical URL, OG tags and JSON-LD baked into the initial HTML.
//
// The body stays empty — React still hydrates as a normal SPA — but
// crawlers (Google, Bing, Baidu, Facebook, Twitter, WeChat) see the
// real per-page metadata in the first response, which is the whole
// reason a CSR site loses long-tail SEO traffic.
//
// Vercel serves matching static files before applying the SPA rewrite
// in vercel.json, so /tools/json hits dist/tools/json/index.html.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const SITE = "https://onetools.dev";
const DEFAULT_IMAGE = `${SITE}/og-image.png`;

// Primary language for crawler-facing HTML. Users still get the client
// language switcher post-hydration; this only controls the static shell.
const LANG = "zh";
const i18n = JSON.parse(
  readFileSync(resolve(ROOT, "src/i18n", `${LANG}.json`), "utf8")
);

// Route table — must stay in sync with src/App.jsx and generate-sitemap.js.
// tool: i18n key under `tools.*` (provides name + desc).
// schemaName: SoftwareApplication.name for JSON-LD (English so it indexes well).
const ROUTES = [
  // home
  {
    path: "/",
    title: i18n.home.title,
    description: i18n.home.subtitle,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "OneTools",
      url: SITE,
      description: i18n.home.subtitle,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
      publisher: { "@type": "Organization", name: "OneTools", url: SITE },
    },
  },

  // tools — (path, tool key, English name for JSON-LD)
  ...[
    ["/tools/remove-watermark", "removeWatermark", "OneTools AI Watermark Remover"],
    ["/tools/remove-bg",        "removeBg",        "OneTools AI Background Remover"],
    ["/tools/id-photo",         "idPhoto",         "OneTools ID Photo Maker"],
    ["/tools/image-compress",   "imageCompress",   "OneTools Image Compressor"],
    ["/tools/upscale",          "upscale",         "OneTools AI Image Upscaler"],
    ["/tools/palette",          "palette",         "OneTools Color Palette Extractor"],
    ["/tools/file-encrypt",     "fileEncrypt",     "OneTools File Encryptor"],
    ["/tools/exif",             "exif",            "OneTools EXIF Viewer"],
    ["/tools/pdf",              "pdf",             "OneTools PDF Toolkit"],
    ["/tools/pdf-summary",      "pdfSummary",      "OneTools AI PDF Summarizer"],
    ["/tools/ocr",              "ocr",             "OneTools OCR"],
    ["/tools/handwriting",      "handwriting",     "OneTools Handwriting OCR"],
    ["/tools/image-to-table",   "imageToTable",    "OneTools Image-to-Table OCR"],
    ["/tools/video-compress",   "videoCompress",   "OneTools Video Compressor"],
    ["/tools/video-to-gif",     "videoToGif",      "OneTools Video to GIF"],
    ["/tools/whisper",          "whisper",         "OneTools Whisper Transcriber"],
    ["/tools/json",             "jsonFormatter",   "OneTools JSON Formatter"],
    ["/tools/markdown",         "markdownPreview", "OneTools Markdown Preview"],
    ["/tools/naming",           "naming",          "OneTools Naming Assistant"],
    ["/tools/cron",             "cron",            "OneTools Cron Expression Helper"],
    ["/tools/timestamp",        "timestamp",       "OneTools Timestamp Converter"],
    ["/tools/flowchart",        "flowchart",       "OneTools Flowchart Generator"],
    ["/tools/base64",           "base64",          "OneTools Base64 Encoder"],
    ["/tools/qrcode",           "qrcode",          "OneTools QR Code Generator"],
  ].map(([path, key, schemaName]) => ({
    path,
    title: i18n.tools[key].name,
    description: i18n.tools[key].desc,
    schema: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: schemaName,
      description: i18n.tools[key].desc,
      url: `${SITE}${path}`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web-based)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  })),

  // info pages
  {
    path: "/about",
    title: i18n.legal.about.title,
    description: i18n.legal.about.subtitle,
  },
  {
    path: "/privacy",
    title: i18n.legal.privacy.title,
    description: i18n.legal.privacy.subtitle,
  },
  {
    path: "/terms",
    title: i18n.legal.terms.title,
    description: i18n.legal.terms.subtitle,
  },
];

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function buildHead({ path, title, description, schema }) {
  const canonical = `${SITE}${path}`;
  const fullTitle =
    path === "/" ? `${title} · OneTools` : `${title} · OneTools`;
  const desc = description || "";
  const meta = [
    `<title>${escapeHtml(fullTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:site_name" content="OneTools" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${DEFAULT_IMAGE}" />`,
    `<meta property="og:locale" content="${LANG === "zh" ? "zh_CN" : "en_US"}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `<meta name="twitter:image" content="${DEFAULT_IMAGE}" />`,
  ];
  if (schema) {
    meta.push(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
  return meta.join("\n    ");
}

// Strip the default <title>, default meta description and the default
// OG tags from the source index.html; we'll inject route-specific ones.
function rewriteHead(html, headBlock) {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, "");
  out = out.replace(
    /<meta\s+name=["']description["'][\s\S]*?\/?\s*>/gi,
    ""
  );
  out = out.replace(
    /<meta\s+property=["']og:(site_name|type|title|description|image|image:width|image:height|url|locale)["'][\s\S]*?\/?\s*>/gi,
    ""
  );
  out = out.replace(
    /<meta\s+name=["']twitter:(card|title|description|image)["'][\s\S]*?\/?\s*>/gi,
    ""
  );
  out = out.replace(
    /<link\s+rel=["']canonical["'][\s\S]*?\/?\s*>/gi,
    ""
  );
  // Inject our block right before </head>.
  return out.replace(/<\/head>/i, `    ${headBlock}\n  </head>`);
}

function writeRoute(srcHtml, route) {
  const headBlock = buildHead(route);
  const html = rewriteHead(srcHtml, headBlock);
  const outDir =
    route.path === "/" ? DIST : join(DIST, route.path.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html, "utf8");
}

function main() {
  const indexPath = join(DIST, "index.html");
  if (!existsSync(indexPath)) {
    console.error(
      `prerender: dist/index.html not found — run \`vite build\` first.`
    );
    process.exit(1);
  }
  const src = readFileSync(indexPath, "utf8");
  for (const r of ROUTES) writeRoute(src, r);
  console.log(`prerender: wrote ${ROUTES.length} routes into dist/`);
}

main();
