import { describe, expect, it } from "vitest"
import { formatDate, toLocale } from "./locale"

describe("toLocale", () => {
  it("maps each supported language to its Intl locale tag", () => {
    expect(toLocale("es")).toBe("es-AR")
    expect(toLocale("en")).toBe("en-US")
  })
})

describe("formatDate", () => {
  // Fixed instant, UTC-anchored, so the expected day never drifts with the
  // runner's timezone.
  const iso = "2026-10-15T12:00:00.000Z"

  it("formats a long date in Spanish (Argentina)", () => {
    expect(formatDate(iso, "es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })).toBe(
      "15 de octubre de 2026",
    )
  })

  it("formats the same instant in English (triangulation)", () => {
    expect(formatDate(iso, "en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })).toBe(
      "October 15, 2026",
    )
  })

  it("defaults to the locale's short numeric date when no options are given", () => {
    expect(formatDate(iso, "es", { timeZone: "UTC" })).toBe("15/10/2026")
    expect(formatDate(iso, "en", { timeZone: "UTC" })).toBe("10/15/2026")
  })
})
