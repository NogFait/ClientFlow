import { describe, expect, it } from "vitest"
import { PUBLIC_PAGE_META, PUBLIC_PAGE_META_BY_LANG, PUBLIC_PATHS, getPageMeta } from "./pageMeta"
import { DEFAULT_DESCRIPTION, SITE_URL } from "./site"

// Soft SEO budgets: Google truncates titles around 60 chars and snippets
// around 155–160. Not hard limits of the platform, but a regression guard so
// nobody ships a 200-char description without noticing.
const TITLE_MAX = 60
const DESCRIPTION_MAX = 160

describe("PUBLIC_PAGE_META", () => {
  it("covers exactly the four static public routes (blog pages are added by getPublicPages)", () => {
    expect(PUBLIC_PATHS).toEqual(["/", "/pricing", "/terms", "/privacy"])
  })

  it("keys every entry by its own path (no copy/paste drift between key and value)", () => {
    PUBLIC_PATHS.forEach((path) => {
      expect(PUBLIC_PAGE_META[path].path).toBe(path)
    })
  })

  it("has unique, non-empty titles within the SEO budget", () => {
    const titles = PUBLIC_PATHS.map((path) => PUBLIC_PAGE_META[path].title)
    expect(new Set(titles).size).toBe(titles.length)
    titles.forEach((title) => {
      expect(title.trim().length).toBeGreaterThan(0)
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
    })
  })

  it("has unique, non-empty descriptions within the SEO budget and free of legal placeholders", () => {
    const descriptions = PUBLIC_PATHS.map((path) => PUBLIC_PAGE_META[path].description)
    expect(new Set(descriptions).size).toBe(descriptions.length)
    descriptions.forEach((description) => {
      expect(description.trim().length).toBeGreaterThan(0)
      expect(description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
      // The legal drafts contain "[RAZÓN SOCIAL]"-style placeholders; a
      // snippet built from those would look broken in search results.
      expect(description).not.toMatch(/\[[A-ZÁÉÍÓÚÑ ]+\]/)
    })
  })

  it("keeps the landing description identical to the site default (index.html baseline)", () => {
    expect(PUBLIC_PAGE_META["/"].description).toBe(DEFAULT_DESCRIPTION)
  })
})

describe("getPageMeta (language-aware)", () => {
  it("returns the Spanish entry unchanged for 'es' (same object shape PUBLIC_PAGE_META exposes)", () => {
    expect(getPageMeta("/pricing", "es")).toEqual(PUBLIC_PAGE_META["/pricing"])
    expect(getPageMeta("/pricing", "es").path).toBe("/pricing")
    expect(getPageMeta("/pricing", "es").lang).toBe("es")
  })

  it("localizes the path and copy for 'en' (triangulation: other language)", () => {
    const meta = getPageMeta("/pricing", "en")

    expect(meta.path).toBe("/en/pricing")
    expect(meta.lang).toBe("en")
    expect(meta.title).toBe("Pricing — ClientFlow")
    expect(meta.title).not.toBe(PUBLIC_PAGE_META["/pricing"].title)
    expect(getPageMeta("/", "en").path).toBe("/en")
  })

  it("shares one hreflang set between both language versions (es, en, x-default → es)", () => {
    const es = getPageMeta("/terms", "es")
    const en = getPageMeta("/terms", "en")

    expect(en.alternates).toEqual(es.alternates)
    expect(es.alternates.map((alt) => alt.hreflang)).toEqual(["es", "en", "x-default"])
    expect(es.alternates.find((alt) => alt.hreflang === "x-default")?.href).toBe(`${SITE_URL}/terms`)
    expect(es.alternates.find((alt) => alt.hreflang === "en")?.href).toBe(`${SITE_URL}/en/terms`)
  })

  it("keeps the English titles/descriptions unique and within the same SEO budget as Spanish", () => {
    const entries = PUBLIC_PATHS.map((path) => PUBLIC_PAGE_META_BY_LANG.en[path])
    expect(new Set(entries.map((entry) => entry.title)).size).toBe(entries.length)
    expect(new Set(entries.map((entry) => entry.description)).size).toBe(entries.length)
    entries.forEach((entry) => {
      expect(entry.title.length).toBeLessThanOrEqual(TITLE_MAX)
      expect(entry.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
    })
  })
})
