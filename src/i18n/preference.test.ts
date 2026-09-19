import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { getStoredLang, setStoredLang, useLang, useStoredLang, LANG_STORAGE_KEY } from "./preference"

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("getStoredLang / setStoredLang", () => {
  it("returns null when nothing has been stored yet", () => {
    expect(getStoredLang()).toBeNull()
  })

  it("round-trips a language through localStorage under the clientflow.lang key", () => {
    setStoredLang("en")

    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en")
    expect(getStoredLang()).toBe("en")
  })

  it("ignores garbage in storage instead of returning an unsupported language (triangulation)", () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, "fr")

    expect(getStoredLang()).toBeNull()
  })

  it("swallows storage errors (private mode, disabled storage) rather than crashing the page", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied")
    })

    expect(() => setStoredLang("en")).not.toThrow()
    expect(getStoredLang()).toBeNull()
  })
})

describe("useLang / useStoredLang", () => {
  it("useLang reads the stored preference, defaulting to 'es'", () => {
    const { result } = renderHook(() => useLang())
    expect(result.current).toBe("es")
  })

  it("useStoredLang exposes the raw preference (null when unset) so callers can tell 'unset' from 'es'", () => {
    const { result } = renderHook(() => useStoredLang())
    expect(result.current).toBeNull()
  })

  it("re-renders subscribers when setStoredLang is called (external store, not a one-shot read)", () => {
    const { result } = renderHook(() => useLang())

    act(() => setStoredLang("en"))
    expect(result.current).toBe("en")

    act(() => setStoredLang("es"))
    expect(result.current).toBe("es")
  })

  it("picks up a change made in another tab via the storage event (triangulation)", () => {
    const { result } = renderHook(() => useLang())

    act(() => {
      window.localStorage.setItem(LANG_STORAGE_KEY, "en")
      window.dispatchEvent(new StorageEvent("storage", { key: LANG_STORAGE_KEY, newValue: "en" }))
    })

    expect(result.current).toBe("en")
  })
})
