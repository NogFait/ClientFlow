import { describe, expect, it } from "vitest"
import { formatDateEs } from "./formatDateEs"

describe("formatDateEs", () => {
  it("renders an ISO date as a long Spanish date", () => {
    expect(formatDateEs("2026-09-16")).toBe("16 de septiembre de 2026")
  })

  it("drops the leading zero of the day (triangulation: January, day 01)", () => {
    expect(formatDateEs("2027-01-01")).toBe("1 de enero de 2027")
  })

  it("covers December (last month index)", () => {
    expect(formatDateEs("2026-12-31")).toBe("31 de diciembre de 2026")
  })

  it("throws on anything that is not YYYY-MM-DD", () => {
    expect(() => formatDateEs("16/09/2026")).toThrow(/YYYY-MM-DD/)
    expect(() => formatDateEs("2026-13-01")).toThrow(/month/i)
  })
})
