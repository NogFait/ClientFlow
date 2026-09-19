import { describe, expect, it } from "vitest"
import {
  currentMonthKey,
  formatMonthEsAr,
  isFutureMonth,
  monthRange,
  parseMonthKey,
  shiftMonth,
  yearRange,
} from "./month"

describe("currentMonthKey", () => {
  it("formats a given date as YYYY-MM", () => {
    expect(currentMonthKey(new Date(2026, 8, 15))).toBe("2026-09")
  })

  it("zero-pads single-digit months (triangulation: January)", () => {
    expect(currentMonthKey(new Date(2026, 0, 1))).toBe("2026-01")
  })

  it("defaults to the current date when no argument is given", () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    expect(currentMonthKey()).toBe(expected)
  })
})

describe("parseMonthKey", () => {
  it("accepts a valid YYYY-MM string", () => {
    expect(parseMonthKey("2026-09")).toBe("2026-09")
  })

  it("accepts month 01 and month 12 (boundary)", () => {
    expect(parseMonthKey("2026-01")).toBe("2026-01")
    expect(parseMonthKey("2026-12")).toBe("2026-12")
  })

  it("rejects month 00 and month 13 (triangulation: out of range)", () => {
    expect(parseMonthKey("2026-00")).toBeNull()
    expect(parseMonthKey("2026-13")).toBeNull()
  })

  it("rejects malformed strings", () => {
    expect(parseMonthKey("abc")).toBeNull()
    expect(parseMonthKey("2026")).toBeNull()
    expect(parseMonthKey("2026-9")).toBeNull()
    expect(parseMonthKey("2026-09-01")).toBeNull()
    expect(parseMonthKey("")).toBeNull()
  })
})

describe("shiftMonth", () => {
  it("moves forward within the same year", () => {
    expect(shiftMonth("2026-09", 1)).toBe("2026-10")
  })

  it("moves backward within the same year", () => {
    expect(shiftMonth("2026-09", -1)).toBe("2026-08")
  })

  it("rolls over December to January of the next year", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01")
  })

  it("rolls back January to December of the previous year (triangulation)", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12")
  })

  it("handles multi-year deltas", () => {
    expect(shiftMonth("2026-06", 13)).toBe("2027-07")
    expect(shiftMonth("2026-06", -13)).toBe("2025-05")
  })

  it("returns the same key for delta 0", () => {
    expect(shiftMonth("2026-09", 0)).toBe("2026-09")
  })
})

describe("monthRange", () => {
  it("returns first-of-month inclusive to first-of-next-month exclusive", () => {
    expect(monthRange("2026-09")).toEqual({ from: "2026-09-01", to: "2026-10-01" })
  })

  it("rolls over December into January of the next year", () => {
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" })
  })

  it("handles February in a leap year (triangulation)", () => {
    expect(monthRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-03-01" })
  })

  it("handles February in a non-leap year", () => {
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-03-01" })
  })
})

describe("yearRange", () => {
  it("spans Jan 1 to Jan 1 of the next year", () => {
    expect(yearRange("2026-09")).toEqual({ from: "2026-01-01", to: "2027-01-01" })
  })

  it("works for a January month key (triangulation)", () => {
    expect(yearRange("2026-01")).toEqual({ from: "2026-01-01", to: "2027-01-01" })
  })
})

describe("formatMonthEsAr", () => {
  it("formats as capitalized Spanish month + year, no 'de'", () => {
    expect(formatMonthEsAr("2026-09")).toBe("Septiembre 2026")
  })

  it("formats January correctly (triangulation: different month)", () => {
    expect(formatMonthEsAr("2026-01")).toBe("Enero 2026")
  })
})

describe("isFutureMonth", () => {
  const now = new Date(2026, 8, 15) // 2026-09-15

  it("returns true for a month after the reference date", () => {
    expect(isFutureMonth("2026-10", now)).toBe(true)
  })

  it("returns false for the current month", () => {
    expect(isFutureMonth("2026-09", now)).toBe(false)
  })

  it("returns false for a past month (triangulation)", () => {
    expect(isFutureMonth("2026-08", now)).toBe(false)
  })

  it("returns true across a year boundary", () => {
    expect(isFutureMonth("2027-01", now)).toBe(true)
  })
})

describe("shortMonthEsAr", () => {
  it("abbreviates the month of a key in Spanish, lowercase", async () => {
    const { shortMonthEsAr } = await import("./month")
    expect(shortMonthEsAr("2026-10")).toBe("oct")
    expect(shortMonthEsAr("2026-01")).toBe("ene")
  })
})

describe("formatMonth (language-aware)", () => {
  it("renders the Spanish form for 'es' — identical to formatMonthEsAr", async () => {
    const { formatMonth } = await import("./month")
    expect(formatMonth("2026-09", "es")).toBe("Septiembre 2026")
    expect(formatMonth("2026-09", "es")).toBe(formatMonthEsAr("2026-09"))
  })

  it("renders the English month name for 'en' (triangulation: different language)", async () => {
    const { formatMonth } = await import("./month")
    expect(formatMonth("2026-09", "en")).toBe("September 2026")
    expect(formatMonth("2026-01", "en")).toBe("January 2026")
  })
})

describe("shortMonth (language-aware)", () => {
  it("keeps the lowercase Spanish abbreviation for 'es'", async () => {
    const { shortMonth } = await import("./month")
    expect(shortMonth("2026-10", "es")).toBe("oct")
  })

  it("uses the capitalized English abbreviation for 'en'", async () => {
    const { shortMonth } = await import("./month")
    expect(shortMonth("2026-10", "en")).toBe("Oct")
    expect(shortMonth("2026-01", "en")).toBe("Jan")
  })
})

describe("monthName", () => {
  it("returns the capitalized full month name for a 0-based index", async () => {
    const { monthName } = await import("./month")
    expect(monthName(8, "es")).toBe("Septiembre")
    expect(monthName(8, "en")).toBe("September")
    expect(monthName(0, "es")).toBe("Enero")
  })
})
