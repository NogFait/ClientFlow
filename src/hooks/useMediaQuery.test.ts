import { afterEach, describe, expect, it } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useMediaQuery } from "./useMediaQuery"

interface MockMql {
  matches: boolean
  addEventListener: (type: string, cb: () => void) => void
  removeEventListener: (type: string, cb: () => void) => void
  fire: () => void
}

function installMatchMedia(initialMatches: boolean): MockMql {
  let listener: (() => void) | null = null
  const mql: MockMql = {
    matches: initialMatches,
    addEventListener: (_type, cb) => {
      listener = cb
    },
    removeEventListener: () => {
      listener = null
    },
    fire: () => listener?.(),
  }
  window.matchMedia = (() => mql) as unknown as typeof window.matchMedia
  return mql
}

afterEach(() => {
  // @ts-expect-error — cleanup the test stub between tests
  delete window.matchMedia
})

describe("useMediaQuery", () => {
  it("returns true immediately when the query already matches", () => {
    installMatchMedia(true)

    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"))

    expect(result.current).toBe(true)
  })

  it("starts false and flips to true when the media query change event fires (triangulation: reactive update)", () => {
    const mql = installMatchMedia(false)

    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"))
    expect(result.current).toBe(false)

    act(() => {
      mql.matches = true
      mql.fire()
    })

    expect(result.current).toBe(true)
  })
})
