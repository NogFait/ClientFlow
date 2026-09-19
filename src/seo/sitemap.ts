import type { HreflangAlternate } from "./alternates"

export interface SitemapEntry {
  /** Absolute URL. */
  loc: string
  /** YYYY-MM-DD. */
  lastmod: string
  /** 0.0 – 1.0 */
  priority: number
  /** Language versions of this URL (Google's sitemap hreflang extension). */
  alternates?: HreflangAlternate[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

// Pure builder for dist/sitemap.xml — written by scripts/prerender.mjs from
// the same page list it prerenders, so the sitemap can never advertise a
// URL that has no static HTML (or miss a post that does).
export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map(({ loc, lastmod, priority, alternates = [] }) => {
    if (!ISO_DATE.test(lastmod)) {
      throw new Error(`sitemap: lastmod for ${loc} must be YYYY-MM-DD, got ${JSON.stringify(lastmod)}`)
    }
    if (priority < 0 || priority > 1) {
      throw new Error(`sitemap: priority for ${loc} must be between 0 and 1, got ${priority}`)
    }
    // One <xhtml:link> per language version, listed on EVERY version of the
    // page (Google requires the set to be reciprocal — the /en URL must name
    // the Spanish one and vice versa, x-default included).
    const alternateLinks = alternates.map(
      ({ hreflang, href }) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}" />`,
    )
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      ...alternateLinks,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <priority>${priority.toFixed(1)}</priority>`,
      "  </url>",
    ].join("\n")
  })

  // The xhtml namespace is declared unconditionally so the document shape
  // never depends on whether any entry happened to carry alternates.
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n")
}
