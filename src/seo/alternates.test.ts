import { describe, expect, it } from "vitest"
import { buildAlternates } from "./alternates"
import { SITE_URL } from "../content/site"

describe("buildAlternates", () => {
  it("emits es, en and x-default (→ es) absolute URLs for a Spanish path", () => {
    expect(buildAlternates("/pricing")).toEqual([
      { hreflang: "es", href: `${SITE_URL}/pricing` },
      { hreflang: "en", href: `${SITE_URL}/en/pricing` },
      { hreflang: "x-default", href: `${SITE_URL}/pricing` },
    ])
  })

  it("produces the same set when given the English path (either side of the pair is a valid input)", () => {
    expect(buildAlternates("/en/pricing")).toEqual(buildAlternates("/pricing"))
  })

  it("maps the root to /en without a trailing slash", () => {
    expect(buildAlternates("/").map((alt) => alt.href)).toEqual([`${SITE_URL}/`, `${SITE_URL}/en`, `${SITE_URL}/`])
  })
})
