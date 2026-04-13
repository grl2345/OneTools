import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

/**
 * Injects <title>, Open Graph / Twitter meta, canonical URL, <html lang>,
 * and optional schema.org JSON-LD into the document head. Used by every
 * page to get unique SEO surfaces per route.
 */
const SITE = "https://onetools.dev";
const DEFAULT_IMAGE = `${SITE}/og-image.svg`;

export default function SEO({
  title,
  description,
  path = "/",
  image,
  noIndex = false,
  structuredData,
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "zh";
  const fullTitle = title ? `${title} · OneTools` : "OneTools — Developer Tools";
  const canonical = SITE + path;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content="OneTools" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={lang === "zh" ? "zh_CN" : "en_US"} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {/* Alternate languages */}
      <link rel="alternate" hrefLang="zh" href={`${SITE}${path}`} />
      <link rel="alternate" hrefLang="en" href={`${SITE}${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE}${path}`} />

      {/* Structured data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

/**
 * Preset generators for common schema.org types.
 */
export const schema = {
  softwareApp: ({ name, description, url }) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (web-based)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "12",
    },
  }),

  website: ({ url = SITE }) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OneTools",
    url,
    description:
      "Privacy-first developer tools: JSON, Markdown, timestamp, image compression, AI background / watermark removal — runs in your browser.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "OneTools",
      url: SITE,
    },
  }),

  breadcrumb: (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: SITE + it.path,
    })),
  }),
};
