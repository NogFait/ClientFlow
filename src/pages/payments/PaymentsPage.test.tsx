import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PaymentsPage from "./PaymentsPage"

const getPaymentsMock = vi.fn()
const deletePaymentMock = vi.fn()
const getProjectsMock = vi.fn()

vi.mock("../../features/payments/services", () => ({
  getPayments: () => getPaymentsMock(),
  createPayment: vi.fn(),
  updatePayment: vi.fn(),
  deletePayment: (id: string) => deletePaymentMock(id),
}))

vi.mock("../../features/projects/services", () => ({
  getProjects: () => getProjectsMock(),
}))

function installMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia
}

afterEach(() => {
  getPaymentsMock.mockReset()
  deletePaymentMock.mockReset()
  getProjectsMock.mockReset()
  installMatchMedia(false)
})

const today = new Date()
const samplePayment = {
  id: "pay1",
  amount: 150.5,
  payment_date: today.toISOString().split("T")[0],
  method: "efectivo" as const,
  status: "pendiente" as const,
  proyectos: { name: "Sitio Web", clientes: { name: "Acme" } },
}

describe("PaymentsPage — delete confirmation", () => {
  it("opens a confirm dialog when Eliminar is clicked and does not delete until confirmed", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])

    render(<PaymentsPage />)

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("¿Eliminar pago de $150.50?")).toBeInTheDocument()
    expect(deletePaymentMock).not.toHaveBeenCalled()
  })

  it("calls deletePayment when the dialog is confirmed", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])
    deletePaymentMock.mockResolvedValue(undefined)

    render(<PaymentsPage />)

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    await waitFor(() => expect(deletePaymentMock).toHaveBeenCalledWith("pay1"))
  })

  it("does NOT call deletePayment when the dialog is cancelled (triangulation)", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])

    render(<PaymentsPage />)

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(deletePaymentMock).not.toHaveBeenCalled()
  })
})

describe("PaymentsPage — responsive table/card layout", () => {
  it("renders the table on desktop viewports", async () => {
    installMatchMedia(false)
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])

    render(<PaymentsPage />)

    expect(await screen.findByRole("table")).toBeInTheDocument()
  })

  it("renders a mobile card list with reachable action buttons on narrow viewports (triangulation)", async () => {
    installMatchMedia(true)
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])

    render(<PaymentsPage />)

    expect(await screen.findByRole("button", { name: /ver pago de \$150\.50/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /editar pago de \$150\.50/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar pago de \$150\.50/i })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})
