import { describe, expect, it } from "vitest"
import { buildSitemapXml } from "./sitemap"

describe("buildSitemapXml", () => {
  it("emits one <url> per entry with loc, lastmod and priority, in order", () => {
    const xml = buildSitemapXml([
      { loc: "https://clientflow.lat/", lastmod: "2026-09-16", priority: 1 },
      { loc: "https://clientflow.lat/blog", lastmod: "2026-09-16", priority: 0.7 },
    ])

    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        "  <url>",
        "    <loc>https://clientflow.lat/</loc>",
        "    <lastmod>2026-09-16</lastmod>",
        "    <priority>1.0</priority>",
        "  </url>",
        "  <url>",
        "    <loc>https://clientflow.lat/blog</loc>",
        "    <lastmod>2026-09-16</lastmod>",
        "    <priority>0.7</priority>",
        "  </url>",
        "</urlset>",
        "",
      ].join("\n"),
    )
  })

  it("escapes XML special characters in loc", () => {
    const xml = buildSitemapXml([{ loc: "https://x.test/a?b=1&c=<2>", lastmod: "2026-01-01", priority: 0.5 }])

    expect(xml).toContain("<loc>https://x.test/a?b=1&amp;c=&lt;2&gt;</loc>")
  })

  it("renders an empty urlset for no entries", () => {
    expect(buildSitemapXml([])).toMatch(/<urlset [^>]*>\n<\/urlset>/)
  })

  it("emits one <xhtml:link rel=\"alternate\"> per hreflang alternate, inside the <url>, after <loc>", () => {
    const xml = buildSitemapXml([
      {
        loc: "https://clientflow.lat/pricing",
        lastmod: "2026-09-16",
        priority: 0.8,
        alternates: [
          { hreflang: "es", href: "https://clientflow.lat/pricing" },
          { hreflang: "en", href: "https://clientflow.lat/en/pricing" },
          { hreflang: "x-default", href: "https://clientflow.lat/pricing" },
        ],
      },
    ])

    expect(xml).toContain(
      [
        "  <url>",
        "    <loc>https://clientflow.lat/pricing</loc>",
        '    <xhtml:link rel="alternate" hreflang="es" href="https://clientflow.lat/pricing" />',
        '    <xhtml:link rel="alternate" hreflang="en" href="https://clientflow.lat/en/pricing" />',
        '    <xhtml:link rel="alternate" hreflang="x-default" href="https://clientflow.lat/pricing" />',
        "    <lastmod>2026-09-16</lastmod>",
        "    <priority>0.8</priority>",
        "  </url>",
      ].join("\n"),
    )
  })

  it("escapes XML special characters in alternate hrefs (triangulation)", () => {
    const xml = buildSitemapXml([
      {
        loc: "https://x.test/",
        lastmod: "2026-01-01",
        priority: 0.5,
        alternates: [{ hreflang: "en", href: "https://x.test/en?a=1&b=2" }],
      },
    ])

    expect(xml).toContain('href="https://x.test/en?a=1&amp;b=2"')
  })

  it("rejects a lastmod that is not YYYY-MM-DD or a priority outside 0..1", () => {
    expect(() => buildSitemapXml([{ loc: "https://x.test/", lastmod: "today", priority: 0.5 }])).toThrow(/lastmod/)
    expect(() => buildSitemapXml([{ loc: "https://x.test/", lastmod: "2026-01-01", priority: 1.5 }])).toThrow(/priority/)
  })
})
