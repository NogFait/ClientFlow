import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useConfirm } from "./useConfirm"

describe("useConfirm", () => {
  it("resolves true when the dialog is confirmed", async () => {
    const { result } = renderHook(() => useConfirm())

    let resolved: boolean | undefined
    act(() => {
      result.current.confirm({ title: "¿Eliminar?" }).then((value) => {
        resolved = value
      })
    })

    expect(result.current.dialogProps.open).toBe(true)
    expect(result.current.dialogProps.title).toBe("¿Eliminar?")

    await act(async () => {
      result.current.dialogProps.onConfirm()
    })

    expect(resolved).toBe(true)
    expect(result.current.dialogProps.open).toBe(false)
  })

  it("resolves false when the dialog is cancelled (triangulation: cancel path)", async () => {
    const { result } = renderHook(() => useConfirm())

    let resolved: boolean | undefined
    act(() => {
      result.current.confirm({ title: "¿Eliminar?" }).then((value) => {
        resolved = value
      })
    })

    await act(async () => {
      result.current.dialogProps.onCancel()
    })

    expect(resolved).toBe(false)
    expect(result.current.dialogProps.open).toBe(false)
  })

  it("only allows one pending confirmation at a time — a second call resolves false immediately", async () => {
    const { result } = renderHook(() => useConfirm())

    let firstResolved: boolean | undefined
    let secondResolved: boolean | undefined

    act(() => {
      result.current.confirm({ title: "Primero" }).then((value) => {
        firstResolved = value
      })
    })

    await act(async () => {
      secondResolved = await result.current.confirm({ title: "Segundo" })
    })

    // The second call is rejected outright (resolves false) and the dialog
    // still reflects the first, still-pending confirmation.
    expect(secondResolved).toBe(false)
    expect(result.current.dialogProps.title).toBe("Primero")
    expect(firstResolved).toBeUndefined()

    await act(async () => {
      result.current.dialogProps.onConfirm()
    })

    expect(firstResolved).toBe(true)
  })

  it("passes through optional fields (description, labels, danger)", () => {
    const { result } = renderHook(() => useConfirm())

    act(() => {
      result.current.confirm({
        title: "¿Eliminar a Juan?",
        description: "Esta acción no se puede deshacer.",
        confirmLabel: "Sí, eliminar",
        cancelLabel: "No",
        danger: false,
      })
    })

    expect(result.current.dialogProps.description).toBe("Esta acción no se puede deshacer.")
    expect(result.current.dialogProps.confirmLabel).toBe("Sí, eliminar")
    expect(result.current.dialogProps.cancelLabel).toBe("No")
    expect(result.current.dialogProps.danger).toBe(false)
  })

  it("passes through cancelLabel: null for informational dialogs with no cancel option (triangulation: hidden cancel)", () => {
    const { result } = renderHook(() => useConfirm())

    act(() => {
      result.current.confirm({
        title: "No se puede eliminar a Juan",
        cancelLabel: null,
        confirmLabel: "Entendido",
      })
    })

    expect(result.current.dialogProps.cancelLabel).toBeNull()
    expect(result.current.dialogProps.confirmLabel).toBe("Entendido")
  })
})
