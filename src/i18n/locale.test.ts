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

describe("date-only values (DB `date` columns)", () => {
  it("parseDateOnly builds a LOCAL midnight, so the calendar day never shifts with the timezone", async () => {
    const { parseDateOnly } = await import("./locale")

    const d = parseDateOnly("2026-09-19")

    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(19)
    expect(d.getHours()).toBe(0)
  })

  it("formatDateOnly shows the same calendar day the DB stored, in the UI language", async () => {
    const { formatDateOnly } = await import("./locale")

    expect(formatDateOnly("2026-09-19", "es")).toBe("19/9/2026")
    expect(formatDateOnly("2026-09-19", "en")).toBe("9/19/2026")
  })

  it("formatDateOnly differs from formatDate for the same string west of UTC (the bug it exists to avoid)", async () => {
    const { formatDateOnly, formatDate } = await import("./locale")
    // new Date("2026-09-19") is UTC midnight; in a UTC-3 zone formatDate
    // renders the 18th. formatDateOnly must render the 19th regardless.
    const utcOffsetMinutes = new Date("2026-09-19").getTimezoneOffset()
    const naive = formatDate("2026-09-19", "es")

    expect(formatDateOnly("2026-09-19", "es")).toBe("19/9/2026")
    if (utcOffsetMinutes > 0) expect(naive).toBe("18/9/2026")
  })
})

describe("todayDateOnly", () => {
  it("formats the local calendar day as YYYY-MM-DD with zero padding", async () => {
    const { todayDateOnly } = await import("./locale")

    expect(todayDateOnly(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05")
    expect(todayDateOnly(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31")
  })
})
