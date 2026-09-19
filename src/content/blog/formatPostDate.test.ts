import { describe, expect, it } from "vitest"
import { formatPostDate } from "./formatPostDate"

// Hand-rolled per language (no Intl) so SSR and every browser agree.
describe("formatPostDate", () => {
  it("formats in Spanish", () => {
    expect(formatPostDate("2026-09-17", "es")).toBe("17 de septiembre de 2026")
  })

  it("formats in English", () => {
    expect(formatPostDate("2026-09-17", "en")).toBe("September 17, 2026")
    expect(formatPostDate("2026-01-05", "en")).toBe("January 5, 2026")
  })
})
