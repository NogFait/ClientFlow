import { afterEach, describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"
import { useDocumentTitle } from "./useDocumentTitle"

afterEach(() => {
  document.title = ""
})

describe("useDocumentTitle", () => {
  it("sets document.title to the given value", () => {
    renderHook(() => useDocumentTitle("ClientFlow — CRM para freelancers"))

    expect(document.title).toBe("ClientFlow — CRM para freelancers")
  })

  it("sets a different title for a different page (triangulation)", () => {
    renderHook(() => useDocumentTitle("Precios — ClientFlow"))

    expect(document.title).toBe("Precios — ClientFlow")
  })
})
