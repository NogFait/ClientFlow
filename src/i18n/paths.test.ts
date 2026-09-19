import { describe, expect, it } from "vitest"
import { langFromPath, toLocalizedPath, hasLocalizedCounterpart, resolveInitialLang, publicPaths } from "./paths"

describe("langFromPath", () => {
  it("reads 'en' from the /en prefix (root and nested)", () => {
    expect(langFromPath("/en")).toBe("en")
    expect(langFromPath("/en/")).toBe("en")
    expect(langFromPath("/en/pricing")).toBe("en")
  })

  it("defaults to 'es' for unprefixed paths", () => {
    expect(langFromPath("/")).toBe("es")
    expect(langFromPath("/pricing")).toBe("es")
    expect(langFromPath("/blog/x")).toBe("es")
  })

  it("does not mistake a path that merely starts with 'en' for the English prefix (triangulation)", () => {
    expect(langFromPath("/enterprise")).toBe("es")
  })
})

describe("toLocalizedPath", () => {
  it("prefixes the Spanish public routes with /en for English", () => {
    expect(toLocalizedPath("/", "en")).toBe("/en")
    expect(toLocalizedPath("/pricing", "en")).toBe("/en/pricing")
    expect(toLocalizedPath("/terms", "en")).toBe("/en/terms")
    expect(toLocalizedPath("/privacy", "en")).toBe("/en/privacy")
  })

  it("strips the /en prefix for Spanish", () => {
    expect(toLocalizedPath("/en", "es")).toBe("/")
    expect(toLocalizedPath("/en/", "es")).toBe("/")
    expect(toLocalizedPath("/en/pricing", "es")).toBe("/pricing")
  })

  it("is idempotent: already-localized paths are returned unchanged", () => {
    expect(toLocalizedPath("/en/pricing", "en")).toBe("/en/pricing")
    expect(toLocalizedPath("/pricing", "es")).toBe("/pricing")
  })

  it("keeps the Spanish-only blog and the non-localized routes as they are for either language", () => {
    expect(toLocalizedPath("/blog/x", "en")).toBe("/blog/x")
    expect(toLocalizedPath("/blog", "en")).toBe("/blog")
    expect(toLocalizedPath("/login", "en")).toBe("/login")
    expect(toLocalizedPath("/register", "en")).toBe("/register")
    expect(toLocalizedPath("/dashboard", "en")).toBe("/dashboard")
  })
})

describe("hasLocalizedCounterpart", () => {
  it("is true for the four public routes in either language", () => {
    expect(hasLocalizedCounterpart("/")).toBe(true)
    expect(hasLocalizedCounterpart("/en")).toBe(true)
    expect(hasLocalizedCounterpart("/en/privacy")).toBe(true)
  })

  it("is false for the blog, auth and app routes (nothing to switch to)", () => {
    expect(hasLocalizedCounterpart("/blog/x")).toBe(false)
    expect(hasLocalizedCounterpart("/login")).toBe(false)
    expect(hasLocalizedCounterpart("/dashboard")).toBe(false)
  })
})

describe("resolveInitialLang", () => {
  it("lets the URL win on localized public routes, regardless of the stored preference", () => {
    expect(resolveInitialLang("/en/pricing", "es")).toBe("en")
    expect(resolveInitialLang("/pricing", "en")).toBe("es")
    expect(resolveInitialLang("/", null)).toBe("es")
  })

  it("keeps the Spanish-only blog in Spanish even for a visitor who prefers English", () => {
    expect(resolveInitialLang("/blog/x", "en")).toBe("es")
  })

  it("falls back to the stored preference (then the default) on routes without a URL language", () => {
    expect(resolveInitialLang("/login", "en")).toBe("en")
    expect(resolveInitialLang("/register", null)).toBe("es")
    expect(resolveInitialLang("/dashboard", "en")).toBe("en")
  })
})

describe("publicPaths", () => {
  it("lists the Spanish and English URLs of a public route, Spanish first", () => {
    expect(publicPaths("/")).toEqual(["/", "/en"])
    expect(publicPaths("/pricing")).toEqual(["/pricing", "/en/pricing"])
  })
})
