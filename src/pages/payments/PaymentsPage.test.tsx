import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import PaymentsPage from "./PaymentsPage"
import { ToastProvider } from "../../components/shared/Toast/ToastProvider"
import { formatCurrency } from "../../utils/currency"
import { currentMonthKey, formatMonthEsAr, monthRange, shiftMonth, yearRange } from "../../utils/month"

// Testing Library's default text/name normalizer collapses ALL whitespace
// (including formatCurrency's NBSP between "$" and the digits) down to a
// regular space before comparing — so DOM/aria-label assertions must match
// against that normalized form, not the raw formatCurrency output (which
// still has the real NBSP, as asserted directly in utils/currency.test.ts).
const money = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, " ")

const getPaymentsInRangeMock = vi.fn()
const getPaymentTotalsMock = vi.fn()
const createPaymentMock = vi.fn()
const updatePaymentMock = vi.fn()
const deletePaymentMock = vi.fn()
const getProjectsMock = vi.fn()

vi.mock("../../features/payments/services", () => ({
  getPaymentsInRange: (range: unknown) => getPaymentsInRangeMock(range),
  getPaymentTotals: (range: unknown) => getPaymentTotalsMock(range),
  createPayment: (payment: unknown) => createPaymentMock(payment),
  updatePayment: (id: string, payment: unknown) => updatePaymentMock(id, payment),
  deletePayment: (id: string) => deletePaymentMock(id),
}))

vi.mock("../../features/projects/services", () => ({
  getProjects: () => getProjectsMock(),
}))

// Export to CSV is Pro; the page reads the plan from the entitlements context.
import type { Entitlements } from "../../features/billing/types"
const freeEntitlements: Entitlements = {
  plan: "free", status: "free", limits: { clientes: 3, proyectos: 5 }, usage: { clientes: 0, proyectos: 0 },
  current_period_end: null, cancel_at_period_end: false, grace_until: null,
}
let currentEntitlements: Entitlements = freeEntitlements
vi.mock("../../features/billing/context/entitlementsContext", () => ({
  useEntitlementsContext: () => ({ entitlements: currentEntitlements, refresh: vi.fn(), loading: false }),
}))

const downloadTextFileMock = vi.fn()
vi.mock("../../utils/download", () => ({
  downloadTextFile: (...args: unknown[]) => downloadTextFileMock(...args),
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
  currentEntitlements = freeEntitlements
  downloadTextFileMock.mockReset()
  getPaymentsInRangeMock.mockReset()
  getPaymentTotalsMock.mockReset()
  createPaymentMock.mockReset()
  updatePaymentMock.mockReset()
  deletePaymentMock.mockReset()
  getProjectsMock.mockReset()
  installMatchMedia(false)
})

function renderAt(path = "/payments") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/payments" element={<PaymentsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderAtWithToast(path = "/payments") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/payments"
          element={
            <ToastProvider>
              <PaymentsPage />
            </ToastProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

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
  it("shows the EmptyState explanation (with the selected month name) when there are no payments, and its CTA opens the create modal", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])

    renderAt()

    expect(
      await screen.findByText(`No registraste pagos en ${formatMonthEsAr(currentMonthKey())}`),
    ).toBeInTheDocument()
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
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])

    renderAt()

    await user.click(await screen.findByRole("button", { name: "Editar" }))

    expect(await screen.findByRole("heading", { name: "Editar pago" })).toBeInTheDocument()
  })
})

describe("PaymentsPage — toast feedback", () => {
  it("shows 'Pago registrado' after creating a payment in the same (current) month", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])
    createPaymentMock.mockResolvedValue(undefined)

    renderAtWithToast()

    await waitFor(() =>
      expect(screen.getByText(`No registraste pagos en ${formatMonthEsAr(currentMonthKey())}`)).toBeInTheDocument(),
    )
    await user.click(screen.getAllByRole("button", { name: "Registrar pago" })[0])
    await user.type(screen.getByLabelText("Monto"), "200")
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText("Pago registrado")).toBeInTheDocument()
  })

  it("shows 'Pago actualizado' after editing an existing payment (triangulation: update path)", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])
    updatePaymentMock.mockResolvedValue(undefined)

    renderAtWithToast()

    await user.click(await screen.findByRole("button", { name: "Editar" }))
    await screen.findByRole("heading", { name: "Editar pago" })
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText("Pago actualizado")).toBeInTheDocument()
  })

  it("shows 'Pago eliminado' after confirming a delete (triangulation: delete path)", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])
    deletePaymentMock.mockResolvedValue(undefined)

    renderAtWithToast()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    expect(await screen.findByText("Pago eliminado")).toBeInTheDocument()
  })
})

describe("PaymentsPage — currency formatting (es-AR)", () => {
  it("renders the payment amount through the shared es-AR formatter in the table and its stat cards", async () => {
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])

    renderAt()

    await screen.findByRole("table")
    // "Total Pendiente" stat card sums the one pending sample payment, so its
    // value equals the same formatted amount as the table cell.
    expect(screen.getAllByText(money(150.5))).not.toHaveLength(0)
  })
})

describe("PaymentsPage — delete confirmation", () => {
  it("opens a confirm dialog when Eliminar is clicked and does not delete until confirmed", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])

    renderAt()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(`¿Eliminar pago de ${money(150.5)}?`)).toBeInTheDocument()
    expect(deletePaymentMock).not.toHaveBeenCalled()
  })

  it("calls deletePayment when the dialog is confirmed", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])
    deletePaymentMock.mockResolvedValue(undefined)

    renderAt()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    await waitFor(() => expect(deletePaymentMock).toHaveBeenCalledWith("pay1"))
  })

  it("does NOT call deletePayment when the dialog is cancelled (triangulation)", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])

    renderAt()

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
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])

    renderAt()

    expect(await screen.findByRole("table")).toBeInTheDocument()
  })

  it("renders a mobile card list with reachable action buttons on narrow viewports (triangulation)", async () => {
    installMatchMedia(true)
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])

    renderAt()

    // Unlike getByText, getByRole's accessible-name match does NOT collapse
    // the NBSP in aria-label — compare against the raw formatCurrency output.
    const amountLabel = formatCurrency(150.5)
    expect(await screen.findByRole("button", { name: `Ver pago de ${amountLabel}` })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: `Editar pago de ${amountLabel}` })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: `Eliminar pago de ${amountLabel}` })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})

describe("PaymentsPage — month selector (URL sync)", () => {
  it("defaults to the current month when there is no ?month param", async () => {
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])

    renderAt("/payments")

    await waitFor(() =>
      expect(getPaymentsInRangeMock).toHaveBeenCalledWith(monthRange(currentMonthKey())),
    )
    expect(getPaymentTotalsMock).toHaveBeenCalledWith(yearRange(currentMonthKey()))
    expect(screen.getByText(formatMonthEsAr(currentMonthKey()))).toBeInTheDocument()
  })

  it("loads the range for the month given in the URL", async () => {
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])

    renderAt("/payments?month=2026-07")

    await waitFor(() => expect(getPaymentsInRangeMock).toHaveBeenCalledWith(monthRange("2026-07")))
    expect(getPaymentTotalsMock).toHaveBeenCalledWith(yearRange("2026-07"))
    expect(screen.getByText("Julio 2026")).toBeInTheDocument()
  })

  it("falls back to the current month when ?month is invalid, without crashing", async () => {
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])

    renderAt("/payments?month=abc")

    await waitFor(() =>
      expect(getPaymentsInRangeMock).toHaveBeenCalledWith(monthRange(currentMonthKey())),
    )
    expect(screen.getByRole("heading", { name: "Pagos e Ingresos" })).toBeInTheDocument()
  })

  it("moving to the previous month via the selector reloads data for that month", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])

    renderAt("/payments?month=2026-07")
    await waitFor(() => expect(getPaymentsInRangeMock).toHaveBeenCalledWith(monthRange("2026-07")))

    await user.click(screen.getByRole("button", { name: "Mes anterior" }))

    await waitFor(() =>
      expect(getPaymentsInRangeMock).toHaveBeenCalledWith(monthRange(shiftMonth("2026-07", -1))),
    )
    expect(screen.getByText("Junio 2026")).toBeInTheDocument()
  })

  // Pending payments are usually dated in the FUTURE (the next instalment),
  // so future months must be reachable — otherwise "pendiente" money is
  // invisible in every monthly view.
  it("allows navigating to future months, where pending payments live", async () => {
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])

    renderAt("/payments")

    await screen.findByText(formatMonthEsAr(currentMonthKey()))
    expect(screen.getByRole("button", { name: "Mes siguiente" })).toBeEnabled()
  })

  it("lists the months that still have pending payments on the year card", async () => {
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 350, pendingByMonth: { "2026-10": 300, "2026-11": 50 } })
    getProjectsMock.mockResolvedValue([])

    renderAt("/payments?month=2026-09")

    expect(await screen.findByText("pendiente · oct, nov")).toBeInTheDocument()
  })

  it("labels the month cards with the month they refer to", async () => {
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])

    renderAt("/payments?month=2026-03")

    expect(await screen.findByText("Cobrado en marzo 2026")).toBeInTheDocument()
    expect(screen.getByText("Pendiente en marzo 2026")).toBeInTheDocument()
  })

  it("shows the year accumulated stat (paid + pending) using formatCurrency", async () => {
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 98765.43, pending: 321 })
    getProjectsMock.mockResolvedValue([])

    renderAt()

    await waitFor(() => expect(getPaymentTotalsMock).toHaveBeenCalled())
    expect(screen.getAllByText(money(98765.43)).length).toBeGreaterThan(0)
    expect(screen.getByText(money(321), { exact: false })).toBeInTheDocument()
  })
})

describe("PaymentsPage — create while viewing another month", () => {
  it("navigates the selector to the created payment's month and shows a month-specific toast", async () => {
    const user = userEvent.setup()
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0 })
    getProjectsMock.mockResolvedValue([])
    createPaymentMock.mockResolvedValue(undefined)

    const pastMonth = shiftMonth(currentMonthKey(), -2)
    const pastDate = `${pastMonth}-10`

    renderAtWithToast("/payments")

    await waitFor(() =>
      expect(screen.getByText(`No registraste pagos en ${formatMonthEsAr(currentMonthKey())}`)).toBeInTheDocument(),
    )
    await user.click(screen.getAllByRole("button", { name: "Registrar pago" })[0])

    await user.type(screen.getByLabelText("Monto"), "300")
    const dateInput = screen.getByLabelText("Fecha de pago") as HTMLInputElement
    await user.clear(dateInput)
    await user.type(dateInput, pastDate)

    await user.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText(`Pago registrado en ${formatMonthEsAr(pastMonth)}`)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(formatMonthEsAr(pastMonth))).toBeInTheDocument())
    expect(getPaymentsInRangeMock).toHaveBeenCalledWith(monthRange(pastMonth))
  })
})

describe("PaymentsPage — export to CSV (Pro)", () => {
  it("shows a locked 'Exportar a Excel' control (not the export buttons) for a Free user", async () => {
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])
    renderAt()

    await screen.findByText("Acme")
    expect(screen.getByRole("button", { name: /Exportar a Excel/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Exportar (?!a Excel)/i })).not.toBeInTheDocument()
  })

  it("downloads the month as CSV (header + one row with names, not ids) for a Pro user", async () => {
    currentEntitlements = { ...freeEntitlements, plan: "pro_monthly", status: "active", limits: { clientes: null, proyectos: null } }
    getPaymentsInRangeMock.mockResolvedValue([{ ...samplePayment, notes: "Seña" }])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])
    const user = userEvent.setup()
    renderAtWithToast()
    await screen.findByText("Acme")

    // "Exportar septiembre 2026" (month name + year) vs "Exportar 2026" (year only)
    await user.click(screen.getByRole("button", { name: /^Exportar [a-záéíóúñ]+ \d{4}$/i }))

    await waitFor(() => expect(downloadTextFileMock).toHaveBeenCalledTimes(1))
    const [filename, content, mime] = downloadTextFileMock.mock.calls[0] as [string, string, string]
    expect(filename).toMatch(/^clientflow-pagos-\d{4}-\d{2}\.csv$/)
    expect(mime).toContain("text/csv")
    const lines = content.split("\r\n")
    expect(lines[0]).toBe("\uFEFFFecha;Cliente;Proyecto;Monto;Método;Estado;Notas")
    expect(lines[1]).toBe(`${samplePayment.payment_date};Acme;Sitio Web;150,5;Efectivo;Pendiente;Seña`)
    expect(await screen.findByText(/Archivo descargado/i)).toBeInTheDocument()
  })

  it("fetches the whole year and names the file by year when exporting the year", async () => {
    currentEntitlements = { ...freeEntitlements, plan: "pro_yearly", status: "active", limits: { clientes: null, proyectos: null } }
    getPaymentsInRangeMock.mockResolvedValue([samplePayment])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 150.5 })
    getProjectsMock.mockResolvedValue([])
    const user = userEvent.setup()
    renderAtWithToast()
    await screen.findByText("Acme")
    const year = samplePayment.payment_date.slice(0, 4)

    await user.click(screen.getByRole("button", { name: `Exportar ${year}` }))

    await waitFor(() => expect(downloadTextFileMock).toHaveBeenCalledTimes(1))
    expect(getPaymentsInRangeMock).toHaveBeenCalledWith({ from: `${year}-01-01`, to: `${Number(year) + 1}-01-01` })
    expect((downloadTextFileMock.mock.calls[0] as [string])[0]).toBe(`clientflow-pagos-${year}.csv`)
  })
})
