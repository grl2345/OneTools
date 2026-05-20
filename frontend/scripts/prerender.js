// Post-build prerender. After `vite build`, walks the route table and
// writes a per-route dist/<route>/index.html with the correct <title>,
// <meta>, canonical URL, OG tags and JSON-LD baked into the initial HTML.
//
// Schemas emitted per route:
//   - WebSite + ItemList (home: directory of all 24 tools)
//   - SoftwareApplication (every tool page)
//   - FAQPage (any page whose key exists under i18n `faq.*`)
//   - BreadcrumbList (every page except home)
//
// We also bake a minimal <h1> + intro paragraph into <noscript> so
// non-JS crawlers see the page heading and description, not just an
// empty <div id="root">. React still hydrates as a normal SPA.
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

// Tool table: [path, i18n key under tools.*, English name for SoftwareApplication JSON-LD]
const TOOLS = [
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
];

// Map a route path to its faq.<key> entry (only some tools have an FAQ written).
const FAQ_KEY_BY_PATH = {
  "/": "home",
  "/tools/id-photo": "idPhoto",
  "/tools/remove-watermark": "removeWatermark",
  "/tools/pdf-summary": "pdfSummary",
  "/tools/video-compress": "videoCompress",
  "/tools/file-encrypt": "fileEncrypt",
};

function softwareAppSchema(path, schemaName, description) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: schemaName,
    description,
    url: `${SITE}${path}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (web-based)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

function webSiteSchema() {
  return {
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
  };
}

function itemListSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "OneTools — All Tools",
    numberOfItems: TOOLS.length,
    itemListElement: TOOLS.map(([path, key, schemaName], i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}${path}`,
      name: i18n.tools[key].name,
      description: i18n.tools[key].desc,
    })),
  };
}

function faqSchema(faqKey) {
  const items = i18n.faq?.[faqKey];
  if (!Array.isArray(items) || items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

function breadcrumbSchema(path, title) {
  if (path === "/") return null;
  const items = [
    { name: "Home", path: "/" },
    { name: title, path },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE}${it.path}`,
    })),
  };
}

// Build a full route descriptor — title/desc/schemas/h1/intro — for one path.
function buildRoute({ path, title, description, schemas, h1, intro }) {
  return { path, title, description, schemas: schemas.filter(Boolean), h1, intro };
}

const ROUTES = [
  buildRoute({
    path: "/",
    title: i18n.home.title,
    description: i18n.home.subtitle,
    schemas: [webSiteSchema(), itemListSchema(), faqSchema("home")],
    h1: i18n.home.title,
    intro: i18n.home.subtitle,
  }),

  ...TOOLS.map(([path, key, schemaName]) => {
    const name = i18n.tools[key].name;
    const desc = i18n.tools[key].desc;
    return buildRoute({
      path,
      title: name,
      description: desc,
      schemas: [
        softwareAppSchema(path, schemaName, desc),
        faqSchema(FAQ_KEY_BY_PATH[path]),
        breadcrumbSchema(path, name),
      ],
      h1: name,
      intro: desc,
    });
  }),

  buildRoute({
    path: "/about",
    title: i18n.legal.about.title,
    description: i18n.legal.about.subtitle,
    schemas: [breadcrumbSchema("/about", i18n.legal.about.title)],
    h1: i18n.legal.about.title,
    intro: i18n.legal.about.subtitle,
  }),
  buildRoute({
    path: "/privacy",
    title: i18n.legal.privacy.title,
    description: i18n.legal.privacy.subtitle,
    schemas: [breadcrumbSchema("/privacy", i18n.legal.privacy.title)],
    h1: i18n.legal.privacy.title,
    intro: i18n.legal.privacy.subtitle,
  }),
  buildRoute({
    path: "/terms",
    title: i18n.legal.terms.title,
    description: i18n.legal.terms.subtitle,
    schemas: [breadcrumbSchema("/terms", i18n.legal.terms.title)],
    h1: i18n.legal.terms.title,
    intro: i18n.legal.terms.subtitle,
  }),
];

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function buildHead({ path, title, description, schemas }) {
  const canonical = `${SITE}${path}`;
  const fullTitle = `${title} · OneTools`;
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
  for (const s of schemas) {
    meta.push(
      `<script type="application/ld+json">${JSON.stringify(s)}</script>`
    );
  }
  return meta.join("\n    ");
}

// Body crawler shell: an <h1> + paragraph that lives inside <div id="root">
// and gets replaced the moment React hydrates. It's visible to non-JS
// crawlers and gives Lighthouse a measurable LCP target on a blank app.
// For the home page we also include a static <ul> of all tools so the
// link graph is reachable without running JS.
function buildBodyShell({ path, h1, intro }) {
  const heading = `<h1 style="font-size:36px;font-weight:800;letter-spacing:-1.5px;margin:32px auto 12px;max-width:880px;padding:0 24px;text-align:center;">${escapeHtml(h1)}</h1>`;
  const para = `<p style="font-size:16px;line-height:1.55;color:#52525b;max-width:680px;margin:0 auto 24px;padding:0 24px;text-align:center;">${escapeHtml(intro)}</p>`;
  let extra = "";
  if (path === "/") {
    const lis = TOOLS.map(
      ([p, key]) =>
        `<li><a href="${p}">${escapeHtml(i18n.tools[key].name)}</a> — ${escapeHtml(i18n.tools[key].desc)}</li>`
    ).join("");
    extra = `<nav aria-label="All tools" style="max-width:880px;margin:24px auto;padding:0 24px;"><h2 style="font-size:20px;">All Tools</h2><ul>${lis}</ul></nav>`;
  }
  return `<div style="padding:48px 0;">${heading}${para}${extra}</div>`;
}

function rewriteHead(html, headBlock) {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, "");
  out = out.replace(/<meta\s+name=["']description["'][\s\S]*?\/?\s*>/gi, "");
  out = out.replace(
    /<meta\s+property=["']og:(site_name|type|title|description|image|image:width|image:height|url|locale)["'][\s\S]*?\/?\s*>/gi,
    ""
  );
  out = out.replace(
    /<meta\s+name=["']twitter:(card|title|description|image)["'][\s\S]*?\/?\s*>/gi,
    ""
  );
  out = out.replace(/<link\s+rel=["']canonical["'][\s\S]*?\/?\s*>/gi, "");
  return out.replace(/<\/head>/i, `    ${headBlock}\n  </head>`);
}

function injectBodyShell(html, shell) {
  // Replace the empty <div id="root"></div> with one that contains the shell.
  // React's hydrate/render replaces children on mount.
  return html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root">${shell}</div>`
  );
}

function writeRoute(srcHtml, route) {
  const headBlock = buildHead(route);
  const shell = buildBodyShell(route);
  let html = rewriteHead(srcHtml, headBlock);
  html = injectBodyShell(html, shell);
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
