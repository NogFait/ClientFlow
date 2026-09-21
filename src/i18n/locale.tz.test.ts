import { beforeAll, describe, expect, it } from "vitest"

// Runs with the clock in Argentina (UTC-3), the app's main audience: this is
// where `new Date("YYYY-MM-DD")` (UTC midnight) lands on the PREVIOUS local
// day.
// TZ is pinned suite-wide in vitest.config.ts; this guard makes the
// assumption explicit instead of silently passing under UTC.
beforeAll(() => {
  expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(180)
})

describe("date-only helpers under UTC-3", () => {
  it("documents the bug: a DB date parsed with new Date() is the day before", () => {
    expect(new Date("2026-09-19").getDate()).toBe(18)
  })

  it("parseDateOnly / formatDateOnly keep the stored calendar day", async () => {
    const { parseDateOnly, formatDateOnly } = await import("./locale")

    expect(parseDateOnly("2026-09-19").getDate()).toBe(19)
    expect(formatDateOnly("2026-09-19", "es")).toBe("19/9/2026")
    // ICU renders the separator differently across engines ("01 sept" vs
    // "01-sept"); the day number is what must not shift.
    expect(formatDateOnly("2026-09-01", "es", { day: "2-digit", month: "short" })).toMatch(/^01.sept/)
  })

  it("todayDateOnly is the LOCAL day even late at night, unlike toISOString()", async () => {
    const { todayDateOnly } = await import("./locale")
    const lateEvening = new Date(2026, 8, 19, 22, 30) // 19 Sep 22:30 local = 20 Sep 01:30 UTC

    expect(todayDateOnly(lateEvening)).toBe("2026-09-19")
    expect(lateEvening.toISOString().slice(0, 10)).toBe("2026-09-20")
  })

  it("monthKeyOf / isInMonth bucket by the stored month, so the 1st never leaks into the previous month", async () => {
    const { monthKeyOf, isInMonth } = await import("./locale")

    expect(monthKeyOf("2026-09-01")).toBe("2026-09")
    expect(isInMonth("2026-09-01", 2026, 8)).toBe(true)
    expect(isInMonth("2026-09-01", 2026, 7)).toBe(false)
    // The naive version puts the 1st of September in August here:
    const naive = new Date("2026-09-01")
    expect(naive.getMonth()).toBe(7)
  })
})
