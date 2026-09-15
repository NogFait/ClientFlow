import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ToastProvider } from "./ToastProvider"
import { useToast } from "./useToast"
import { _reset } from "./toastStore"

function TestTrigger() {
  const toast = useToast()
  return (
    <div>
      <button onClick={() => toast.success("Cliente guardado")}>disparar éxito</button>
      <button onClick={() => toast.error("Algo falló")}>disparar error</button>
    </div>
  )
}

beforeEach(() => {
  _reset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("ToastProvider + useToast", () => {
  it("renders children unaffected when there are no toasts", () => {
    render(
      <ToastProvider>
        <p>contenido de la página</p>
      </ToastProvider>,
    )

    expect(screen.getByText("contenido de la página")).toBeInTheDocument()
  })

  it("shows a success toast with role=status and aria-live=polite when triggered", async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole("button", { name: "disparar éxito" }))

    const status = await screen.findByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveTextContent("Cliente guardado")
  })

  it("shows an error toast (triangulation: different variant/message)", async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole("button", { name: "disparar error" }))

    expect(await screen.findByText("Algo falló")).toBeInTheDocument()
  })

  it("dismisses a toast when its close button is clicked", async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole("button", { name: "disparar éxito" }))
    await screen.findByText("Cliente guardado")

    await user.click(screen.getByRole("button", { name: /cerrar notificación/i }))

    await waitFor(() => expect(screen.queryByText("Cliente guardado")).not.toBeInTheDocument())
  })

  it("auto-dismisses a toast after 3 seconds", () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    )

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "disparar éxito" }))
    })
    expect(screen.getByText("Cliente guardado")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText("Cliente guardado")).not.toBeInTheDocument()
  })
})
