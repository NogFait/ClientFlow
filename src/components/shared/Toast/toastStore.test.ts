import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { _reset, dismiss, getSnapshot, push, subscribe } from "./toastStore"

beforeEach(() => {
  vi.useFakeTimers()
  _reset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("toastStore", () => {
  it("push adds a toast to the snapshot with the given message and variant", () => {
    push("Cliente guardado", "success")

    expect(getSnapshot()).toEqual([
      expect.objectContaining({ message: "Cliente guardado", variant: "success" }),
    ])
  })

  it("stacks multiple toasts in push order (triangulation: two pushes)", () => {
    push("Primero", "success")
    push("Segundo", "error")

    const snapshot = getSnapshot()
    expect(snapshot).toHaveLength(2)
    expect(snapshot[0].message).toBe("Primero")
    expect(snapshot[1].message).toBe("Segundo")
  })

  it("push accepts the info variant (triangulation: third variant)", () => {
    push("Quedan 2 tareas pendientes", "info")

    expect(getSnapshot()).toEqual([
      expect.objectContaining({ message: "Quedan 2 tareas pendientes", variant: "info" }),
    ])
  })

  it("auto-dismisses a toast after 3 seconds", () => {
    push("Se va solo", "success")
    expect(getSnapshot()).toHaveLength(1)

    vi.advanceTimersByTime(3000)

    expect(getSnapshot()).toHaveLength(0)
  })

  it("does not auto-dismiss before 3 seconds have elapsed (triangulation)", () => {
    push("Todavía no", "success")

    vi.advanceTimersByTime(2999)

    expect(getSnapshot()).toHaveLength(1)
  })

  it("dismiss removes a toast by id manually, before the timer fires", () => {
    const id = push("Cerralo ahora", "error")

    dismiss(id)

    expect(getSnapshot()).toHaveLength(0)
  })

  it("dismiss on an unknown id is a no-op", () => {
    push("Queda", "success")

    dismiss("does-not-exist")

    expect(getSnapshot()).toHaveLength(1)
  })

  it("notifies subscribers on push and dismiss", () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    const id = push("Notificame", "success")
    expect(listener).toHaveBeenCalledTimes(1)

    dismiss(id)
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    push("Ya no escucho", "success")
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
