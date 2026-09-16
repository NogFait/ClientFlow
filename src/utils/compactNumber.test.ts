import { describe, expect, it } from "vitest"
import { formatCompactNumber } from "./compactNumber"

// Axis ticks for money charts: short enough for a 40px column on mobile,
// deterministic across Node/jsdom (no Intl compact notation).
describe("formatCompactNumber", () => {
  it("leaves small numbers untouched", () => {
    expect(formatCompactNumber(0)).toBe("0")
    expect(formatCompactNumber(950)).toBe("950")
  })

  it("abbreviates thousands with k", () => {
    expect(formatCompactNumber(1000)).toBe("1k")
    expect(formatCompactNumber(600000)).toBe("600k")
    expect(formatCompactNumber(12500)).toBe("12,5k")
  })

  it("abbreviates millions with M", () => {
    expect(formatCompactNumber(1000000)).toBe("1M")
    expect(formatCompactNumber(2400000)).toBe("2,4M")
  })
})
