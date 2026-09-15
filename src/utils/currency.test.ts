import { describe, expect, it } from "vitest"
import { formatCurrency } from "./currency"

// Intl.NumberFormat("es-AR", { style: "currency", ... }) separates the
// symbol from the digits with a non-breaking space (U+00A0), not a regular
// space — spelled out explicitly here so a plain-space copy-paste of the
// "$ 1.500.000,00" spec text doesn't silently fail this suite.
const NBSP = " "

describe("formatCurrency", () => {
  it("formats ARS amounts with the es-AR grouping/decimal separators by default", () => {
    expect(formatCurrency(1500000)).toBe(`$${NBSP}1.500.000,00`)
  })

  it("formats USD amounts with the US$ symbol", () => {
    expect(formatCurrency(120, "USD")).toBe(`US$${NBSP}120,00`)
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe(`$${NBSP}0,00`)
  })

  it("formats negative amounts", () => {
    expect(formatCurrency(-150.5)).toBe(`-$${NBSP}150,50`)
  })

  it("always shows two decimal places (triangulation: whole number)", () => {
    expect(formatCurrency(150)).toBe(`$${NBSP}150,00`)
  })
})
