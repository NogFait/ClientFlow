import { describe, expect, it } from "vitest"
import { SITE_URL } from "../content/site"
// ?raw pulls the file in as a plain string (Vite's raw-import convention,
// declared by vite/client.d.ts) instead of resolving it as a module or
// bundled asset URL — this project's tsconfig.app.json scopes "types" to
// vite/client only (no @types/node), so a Node fs read isn't available
// here; this reads the exact bytes Vercel serves from public/ either way.
import robotsTxt from "../../public/robots.txt?raw"
import sitemapXml from "../../public/sitemap.xml?raw"

const PRIVATE_ROUTE_PREFIXES = ["/dashboard", "/clients", "/projects", "/tasks", "/payments", "/settings", "/api"]
const PUBLIC_URLS = [`${SITE_URL}/`, `${SITE_URL}/pricing`, `${SITE_URL}/terms`, `${SITE_URL}/privacy`]

describe("public/robots.txt", () => {
  it("disallows every private/app route prefix", () => {
    PRIVATE_ROUTE_PREFIXES.forEach((prefix) => {
      expect(robotsTxt).toMatch(new RegExp(`Disallow:\\s*${prefix}(\\s|$)`, "m"))
    })
  })

  it("references the sitemap", () => {
    expect(robotsTxt).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })

  it("allows crawling by default", () => {
    expect(robotsTxt).toMatch(/Allow:\s*\/\s*$/m)
  })
})

describe("public/sitemap.xml", () => {
  it("contains exactly the 4 public URLs, as absolute https://clientflow.lat hrefs", () => {
    const locs = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])

    expect(locs).toHaveLength(4)
    expect(new Set(locs)).toEqual(new Set(PUBLIC_URLS))
    locs.forEach((loc) => expect(loc.startsWith(SITE_URL)).toBe(true))
  })

  it("does not reference any private route", () => {
    PRIVATE_ROUTE_PREFIXES.forEach((prefix) => {
      expect(sitemapXml).not.toContain(`${SITE_URL}${prefix}`)
    })
  })
})
