import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PaymentsPage from "./PaymentsPage"
import { ToastProvider } from "../../components/shared/Toast/ToastProvider"
import { formatCurrency } from "../../utils/currency"

// Testing Library's default text/name normalizer collapses ALL whitespace
// (including formatCurrency's NBSP between "$" and the digits) down to a
// regular space before comparing — so DOM/aria-label assertions must match
// against that normalized form, not the raw formatCurrency output (which
// still has the real NBSP, as asserted directly in utils/currency.test.ts).
const money = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, " ")

const getPaymentsMock = vi.fn()
const createPaymentMock = vi.fn()
const updatePaymentMock = vi.fn()
const deletePaymentMock = vi.fn()
const getProjectsMock = vi.fn()

vi.mock("../../features/payments/services", () => ({
  getPayments: () => getPaymentsMock(),
  createPayment: (payment: unknown) => createPaymentMock(payment),
  updatePayment: (id: string, payment: unknown) => updatePaymentMock(id, payment),
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
  createPaymentMock.mockReset()
  updatePaymentMock.mockReset()
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

describe("PaymentsPage — empty state", () => {
  it("shows the EmptyState explanation when there are no payments this month, and its CTA opens the create modal", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([])
    getProjectsMock.mockResolvedValue([])

    render(<PaymentsPage />)

    expect(await screen.findByText("No registraste pagos este mes")).toBeInTheDocument()
    expect(
      screen.getByText("Anotá cada cobro para ver tus ingresos y lo que falta cobrar."),
    ).toBeInTheDocument()

    // Header action and EmptyState CTA share the same label ("Registrar
    // pago") by design — the EmptyState's own button is the second one
    // rendered, right after PageHeader's.
    const registrarButtons = screen.getAllByRole("button", { name: "Registrar pago" })
    expect(registrarButtons).toHaveLength(2)
    await user.click(registrarButtons[1])

    expect(await screen.findByRole("heading", { name: "Registrar pago" })).toBeInTheDocument()
  })
})

describe("PaymentsPage — naming", () => {
  it("labels the header action 'Registrar pago' and titles the edit modal 'Editar pago' (triangulation: edit vs create)", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])

    render(<PaymentsPage />)

    await user.click(await screen.findByRole("button", { name: "Editar" }))

    expect(await screen.findByRole("heading", { name: "Editar pago" })).toBeInTheDocument()
  })
})

describe("PaymentsPage — toast feedback", () => {
  it("shows 'Pago registrado' after creating a payment", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([])
    getProjectsMock.mockResolvedValue([])
    createPaymentMock.mockResolvedValue(undefined)

    const { container } = render(
      <ToastProvider>
        <PaymentsPage />
      </ToastProvider>,
    )

    await waitFor(() => expect(screen.getByText("No registraste pagos este mes")).toBeInTheDocument())
    await user.click(screen.getAllByRole("button", { name: "Registrar pago" })[0])
    await user.type(container.querySelector("form input")!, "200")
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText("Pago registrado")).toBeInTheDocument()
  })

  it("shows 'Pago actualizado' after editing an existing payment (triangulation: update path)", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])
    updatePaymentMock.mockResolvedValue(undefined)

    render(
      <ToastProvider>
        <PaymentsPage />
      </ToastProvider>,
    )

    await user.click(await screen.findByRole("button", { name: "Editar" }))
    await screen.findByRole("heading", { name: "Editar pago" })
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText("Pago actualizado")).toBeInTheDocument()
  })

  it("shows 'Pago eliminado' after confirming a delete (triangulation: delete path)", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])
    deletePaymentMock.mockResolvedValue(undefined)

    render(
      <ToastProvider>
        <PaymentsPage />
      </ToastProvider>,
    )

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    expect(await screen.findByText("Pago eliminado")).toBeInTheDocument()
  })
})

describe("PaymentsPage — currency formatting (es-AR)", () => {
  it("renders the payment amount through the shared es-AR formatter in the table and its stat cards", async () => {
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])

    render(<PaymentsPage />)

    await screen.findByRole("table")
    // "Total Pendiente" stat card sums the one pending sample payment, so its
    // value equals the same formatted amount as the table cell.
    expect(screen.getAllByText(money(150.5))).not.toHaveLength(0)
  })
})

describe("PaymentsPage — delete confirmation", () => {
  it("opens a confirm dialog when Eliminar is clicked and does not delete until confirmed", async () => {
    const user = userEvent.setup()
    getPaymentsMock.mockResolvedValue([samplePayment])
    getProjectsMock.mockResolvedValue([])

    render(<PaymentsPage />)

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(`¿Eliminar pago de ${money(150.5)}?`)).toBeInTheDocument()
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

    // Unlike getByText, getByRole's accessible-name match does NOT collapse
    // the NBSP in aria-label — compare against the raw formatCurrency output.
    const amountLabel = formatCurrency(150.5)
    expect(await screen.findByRole("button", { name: `Ver pago de ${amountLabel}` })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: `Editar pago de ${amountLabel}` })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: `Eliminar pago de ${amountLabel}` })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})
