import { describe, expect, it } from "vitest"
import { PUBLIC_PAGE_META, PUBLIC_PATHS } from "./pageMeta"
import { DEFAULT_DESCRIPTION } from "./site"

// Soft SEO budgets: Google truncates titles around 60 chars and snippets
// around 155–160. Not hard limits of the platform, but a regression guard so
// nobody ships a 200-char description without noticing.
const TITLE_MAX = 60
const DESCRIPTION_MAX = 160

describe("PUBLIC_PAGE_META", () => {
  it("covers exactly the four public indexable routes (the same set as sitemap.xml)", () => {
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
