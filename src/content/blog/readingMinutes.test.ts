import { describe, expect, it } from "vitest"
import { readingMinutes } from "./readingMinutes"

describe("readingMinutes", () => {
  it("is never below 1 minute, even for an empty body", () => {
    expect(readingMinutes("")).toBe(1)
    expect(readingMinutes("   \n\n  ")).toBe(1)
  })

  it("rounds up at 200 words per minute", () => {
    const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ")

    expect(readingMinutes(words(200))).toBe(1)
    expect(readingMinutes(words(201))).toBe(2)
    expect(readingMinutes(words(1000))).toBe(5)
  })

  it("counts whitespace-separated tokens across lines", () => {
    expect(readingMinutes("uno dos\ntres\n\ncuatro")).toBe(1)
  })
})
