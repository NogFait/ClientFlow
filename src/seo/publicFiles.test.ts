import { describe, expect, it } from "vitest"
import { SITE_URL } from "../content/site"
// ?raw pulls the file in as a plain string (Vite's raw-import convention,
// declared by vite/client.d.ts) instead of resolving it as a module or
// bundled asset URL — this project's tsconfig.app.json scopes "types" to
// vite/client only (no @types/node), so a Node fs read isn't available
// here; this reads the exact bytes Vercel serves from public/ either way.
import robotsTxt from "../../public/robots.txt?raw"
import { buildSitemapXml } from "./sitemap"
import { getPublicPages, toSitemapEntries } from "./publicPages"

const PRIVATE_ROUTE_PREFIXES = ["/dashboard", "/clients", "/projects", "/tasks", "/payments", "/settings", "/api"]

describe("public/robots.txt", () => {
  it("disallows every private/app route prefix", () => {
    PRIVATE_ROUTE_PREFIXES.forEach((prefix) => {
      expect(robotsTxt).toMatch(new RegExp(`Disallow:\\s*${prefix}(\\s|$)`, "m"))
    })
  })

  it("does not disallow the blog", () => {
    expect(robotsTxt).not.toMatch(/Disallow:\s*\/blog/)
  })

  it("references the sitemap", () => {
    expect(robotsTxt).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })

  it("allows crawling by default", () => {
    expect(robotsTxt).toMatch(/Allow:\s*\/\s*$/m)
  })
})

// sitemap.xml is no longer a checked-in file: scripts/prerender.mjs writes
// dist/sitemap.xml at build time from getPublicPages() — the same list it
// prerenders — via buildSitemapXml. This exercises that exact composition.
describe("generated sitemap.xml", () => {
  const xml = buildSitemapXml(toSitemapEntries(getPublicPages(), "2026-09-16"))
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])

  it("advertises every public page (static + /blog + published posts) as absolute https hrefs", () => {
    expect(locs).toEqual(getPublicPages().map((page) => `${SITE_URL}${page.path}`))
    locs.forEach((loc) => expect(loc.startsWith(SITE_URL)).toBe(true))
    expect(locs).toContain(`${SITE_URL}/blog`)
  })

  it("does not reference any private route", () => {
    PRIVATE_ROUTE_PREFIXES.forEach((prefix) => {
      expect(xml).not.toContain(`${SITE_URL}${prefix}`)
    })
  })
})
