import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import ScrollReveal from "./ScrollReveal"

type Entry = { isIntersecting: boolean; boundingClientRect?: { bottom: number } }
type Callback = (entries: Entry[]) => void

let callbacks: Callback[] = []
let originalIO: typeof IntersectionObserver

beforeEach(() => {
  callbacks = []
  originalIO = window.IntersectionObserver
  class FakeIO {
    constructor(cb: Callback) {
      callbacks.push(cb)
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver
})

afterEach(() => {
  window.IntersectionObserver = originalIO
  vi.restoreAllMocks()
})

// The landing's reveal must replay on every pass, not just the first: a
// visitor who scrolls back up and down again should see the sections fade
// in again (product decision, 2026-09-16).
describe("ScrollReveal", () => {
  it("re-hides when the block leaves the viewport so it animates again on the next pass", () => {
    render(<ScrollReveal>contenido</ScrollReveal>)
    const block = screen.getByText("contenido")
    const fire = (entry: Entry) => act(() => callbacks.forEach((cb) => cb([entry])))

    expect(block.className).not.toMatch(/visible/)

    fire({ isIntersecting: true, boundingClientRect: { bottom: 300 } })
    expect(block.className).toMatch(/visible/)

    // Scrolled back up: the block is below the viewport again.
    fire({ isIntersecting: false, boundingClientRect: { bottom: 2000 } })
    expect(block.className).not.toMatch(/visible/)

    fire({ isIntersecting: true, boundingClientRect: { bottom: 300 } })
    expect(block.className).toMatch(/visible/)
  })
})
