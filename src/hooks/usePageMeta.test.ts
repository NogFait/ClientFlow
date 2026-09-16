import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"
import { usePageMeta } from "./usePageMeta"
import { SITE_URL, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from "../content/site"

function getMeta(attr: "name" | "property", key: string): HTMLMetaElement | null {
  return document.head.querySelector(`meta[${attr}="${key}"]`)
}

function getCanonical(): HTMLLinkElement | null {
  return document.head.querySelector('link[rel="canonical"]')
}

// index.html ships static baseline tags (title, description, canonical,
// og:*, twitter:*) so the hook always has something pre-existing to
// overwrite-and-restore against — these tests recreate that baseline by
// hand since jsdom only loads the test harness's own empty <head>.
function seedStaticHead() {
  document.title = "ClientFlow"

  const description = document.createElement("meta")
  description.setAttribute("name", "description")
  description.setAttribute("content", DEFAULT_DESCRIPTION)
  document.head.appendChild(description)

  const canonical = document.createElement("link")
  canonical.setAttribute("rel", "canonical")
  canonical.setAttribute("href", `${SITE_URL}/`)
  document.head.appendChild(canonical)

  const ogTitle = document.createElement("meta")
  ogTitle.setAttribute("property", "og:title")
  ogTitle.setAttribute("content", "ClientFlow")
  document.head.appendChild(ogTitle)

  const ogDescription = document.createElement("meta")
  ogDescription.setAttribute("property", "og:description")
  ogDescription.setAttribute("content", DEFAULT_DESCRIPTION)
  document.head.appendChild(ogDescription)

  const ogUrl = document.createElement("meta")
  ogUrl.setAttribute("property", "og:url")
  ogUrl.setAttribute("content", `${SITE_URL}/`)
  document.head.appendChild(ogUrl)

  const ogImage = document.createElement("meta")
  ogImage.setAttribute("property", "og:image")
  ogImage.setAttribute("content", DEFAULT_OG_IMAGE)
  document.head.appendChild(ogImage)
}

function clearHead() {
  document.head
    .querySelectorAll('meta[name="description"], link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"], meta[name="robots"]')
    .forEach((el) => el.remove())
  document.title = ""
}

describe("usePageMeta", () => {
  beforeEach(() => {
    clearHead()
    seedStaticHead()
  })

  afterEach(() => {
    clearHead()
  })

  it("sets document.title and restores the previous title on unmount", () => {
    const { unmount } = renderHook(() => usePageMeta({ title: "Precios — ClientFlow" }))

    expect(document.title).toBe("Precios — ClientFlow")

    unmount()

    expect(document.title).toBe("ClientFlow")
  })

  it("overwrites the meta description and restores it on unmount", () => {
    const { unmount } = renderHook(() =>
      usePageMeta({ title: "Precios — ClientFlow", description: "Un solo plan pago, sin letra chica." }),
    )

    expect(getMeta("name", "description")?.getAttribute("content")).toBe("Un solo plan pago, sin letra chica.")

    unmount()

    expect(getMeta("name", "description")?.getAttribute("content")).toBe(DEFAULT_DESCRIPTION)
  })

  it("falls back to the default description when none is given", () => {
    renderHook(() => usePageMeta({ title: "ClientFlow" }))

    expect(getMeta("name", "description")?.getAttribute("content")).toBe(DEFAULT_DESCRIPTION)
  })

  it("sets the canonical link and og:url from path, and restores them on unmount", () => {
    const { unmount } = renderHook(() => usePageMeta({ title: "Precios — ClientFlow", path: "/pricing" }))

    expect(getCanonical()?.getAttribute("href")).toBe(`${SITE_URL}/pricing`)
    expect(getMeta("property", "og:url")?.getAttribute("content")).toBe(`${SITE_URL}/pricing`)

    unmount()

    expect(getCanonical()?.getAttribute("href")).toBe(`${SITE_URL}/`)
    expect(getMeta("property", "og:url")?.getAttribute("content")).toBe(`${SITE_URL}/`)
  })

  it("leaves canonical/og:url untouched when no path is given", () => {
    renderHook(() => usePageMeta({ title: "Iniciar sesión — ClientFlow", noindex: true }))

    expect(getCanonical()?.getAttribute("href")).toBe(`${SITE_URL}/`)
    expect(getMeta("property", "og:url")?.getAttribute("content")).toBe(`${SITE_URL}/`)
  })

  it("sets og:title/og:description and twitter:title/twitter:description, creating twitter tags that don't pre-exist", () => {
    const { unmount } = renderHook(() =>
      usePageMeta({ title: "Precios — ClientFlow", description: "Sin letra chica." }),
    )

    expect(getMeta("property", "og:title")?.getAttribute("content")).toBe("Precios — ClientFlow")
    expect(getMeta("property", "og:description")?.getAttribute("content")).toBe("Sin letra chica.")
    expect(getMeta("name", "twitter:title")?.getAttribute("content")).toBe("Precios — ClientFlow")
    expect(getMeta("name", "twitter:description")?.getAttribute("content")).toBe("Sin letra chica.")

    unmount()

    // og:title pre-existed (seeded) -> restored, not removed.
    expect(getMeta("property", "og:title")?.getAttribute("content")).toBe("ClientFlow")
    // twitter:title did not pre-exist -> the hook created it, so it's gone again.
    expect(getMeta("name", "twitter:title")).toBeNull()
  })

  it("adds meta robots noindex,nofollow only when noindex is true, and removes it on unmount", () => {
    const { unmount } = renderHook(() => usePageMeta({ title: "Iniciar sesión — ClientFlow", noindex: true }))

    expect(getMeta("name", "robots")?.getAttribute("content")).toBe("noindex,nofollow")

    unmount()

    expect(getMeta("name", "robots")).toBeNull()
  })

  it("does not add a robots meta tag when noindex is false/omitted", () => {
    renderHook(() => usePageMeta({ title: "ClientFlow" }))

    expect(getMeta("name", "robots")).toBeNull()
  })

  it("uses a custom ogImage when given, defaulting to DEFAULT_OG_IMAGE otherwise", () => {
    const { unmount, rerender } = renderHook<void, { ogImage?: string }>(
      ({ ogImage }) => usePageMeta({ title: "ClientFlow", ogImage }),
      { initialProps: { ogImage: undefined } },
    )

    expect(getMeta("property", "og:image")?.getAttribute("content")).toBe(DEFAULT_OG_IMAGE)

    rerender({ ogImage: "https://clientflow.lat/custom.png" })
    expect(getMeta("property", "og:image")?.getAttribute("content")).toBe("https://clientflow.lat/custom.png")

    unmount()
    expect(getMeta("property", "og:image")?.getAttribute("content")).toBe(DEFAULT_OG_IMAGE)
  })
})
