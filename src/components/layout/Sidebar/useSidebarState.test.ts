import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSidebarState } from "./useSidebarState"

const STORAGE_KEY = "clientflow.sidebar.collapsed"

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useSidebarState", () => {
  it("defaults to expanded (collapsed=false) when nothing is persisted", () => {
    const { result } = renderHook(() => useSidebarState())
    expect(result.current.collapsed).toBe(false)
  })

  it("reads a persisted 'true' value on mount (triangulation: pre-existing storage)", () => {
    window.localStorage.setItem(STORAGE_KEY, "true")

    const { result } = renderHook(() => useSidebarState())

    expect(result.current.collapsed).toBe(true)
  })

  it("toggle() flips the state and persists the new value", () => {
    const { result } = renderHook(() => useSidebarState())

    act(() => result.current.toggle())
    expect(result.current.collapsed).toBe(true)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true")

    act(() => result.current.toggle())
    expect(result.current.collapsed).toBe(false)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false")
  })

  it("does not throw when localStorage access fails (private mode / disabled storage)", () => {
    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    const { result } = renderHook(() => useSidebarState())
    expect(result.current.collapsed).toBe(false)

    act(() => result.current.toggle())
    expect(result.current.collapsed).toBe(true)
  })
})
