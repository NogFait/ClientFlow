export interface SitemapEntry {
  /** Absolute URL. */
  loc: string
  /** YYYY-MM-DD. */
  lastmod: string
  /** 0.0 – 1.0 */
  priority: number
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
  const urls = entries.map(({ loc, lastmod, priority }) => {
    if (!ISO_DATE.test(lastmod)) {
      throw new Error(`sitemap: lastmod for ${loc} must be YYYY-MM-DD, got ${JSON.stringify(lastmod)}`)
    }
    if (priority < 0 || priority > 1) {
      throw new Error(`sitemap: priority for ${loc} must be between 0 and 1, got ${priority}`)
    }
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <priority>${priority.toFixed(1)}</priority>`,
      "  </url>",
    ].join("\n")
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n")
}
