import { afterEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router-dom"
import PaymentsPage from "./PaymentsPage"
import { renderWithLang } from "../../test/i18n"

const getPaymentsInRangeMock = vi.fn()
const getPaymentTotalsMock = vi.fn()

vi.mock("../../features/payments/services", () => ({
  getPaymentsInRange: (range: unknown) => getPaymentsInRangeMock(range),
  getPaymentTotals: (range: unknown) => getPaymentTotalsMock(range),
  createPayment: vi.fn(),
  updatePayment: vi.fn(),
  deletePayment: vi.fn(),
}))

vi.mock("../../features/projects/services", () => ({
  getProjects: () => Promise.resolve([]),
}))

afterEach(() => {
  getPaymentsInRangeMock.mockReset()
  getPaymentTotalsMock.mockReset()
})

function renderAt(path: string) {
  return renderWithLang(
    <Routes>
      <Route path="/payments" element={<PaymentsPage />} />
    </Routes>,
    "en",
    { initialEntries: [path] },
  )
}

describe("PaymentsPage — English", () => {
  it("renders the month selector, KPI cards and table headers in English with English month names", async () => {
    getPaymentsInRangeMock.mockResolvedValue([
      {
        id: "pay1",
        amount: 500,
        status: "pagado",
        method: "transferencia",
        payment_date: "2026-09-05",
        project_id: "p1",
        proyectos: { name: "Website", clientes: { name: "Acme" } },
      },
    ])
    getPaymentTotalsMock.mockResolvedValue({ paid: 500, pending: 100, pendingByMonth: { "2026-10": 100 } })

    renderAt("/payments?month=2026-09")

    expect(await screen.findByRole("heading", { name: "Payments & Income" })).toBeInTheDocument()
    expect(screen.getByText("September 2026")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument()
    // English month names are proper nouns: no lowercasing mid-sentence.
    expect(screen.getByText("Collected in September 2026")).toBeInTheDocument()
    expect(screen.getByText("Total 2026")).toBeInTheDocument()
    expect(screen.getByText("pending · Oct")).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Method" })).toBeInTheDocument()
    expect(screen.getByText("Bank transfer")).toBeInTheDocument()
    expect(screen.getByText("Paid")).toBeInTheDocument()
    // Dates follow the UI language (en-US month/day/year). Computed rather
    // than literal: date-only ISO strings parse as UTC midnight, so the
    // rendered day depends on the runner's timezone.
    expect(screen.getByText(new Date("2026-09-05").toLocaleDateString("en-US"))).toBeInTheDocument()
    expect(screen.queryByText(/Septiembre/)).not.toBeInTheDocument()
  })

  it("shows the English empty state naming the month (triangulation)", async () => {
    getPaymentsInRangeMock.mockResolvedValue([])
    getPaymentTotalsMock.mockResolvedValue({ paid: 0, pending: 0, pendingByMonth: {} })

    renderAt("/payments?month=2026-01")

    expect(await screen.findByText("No payments recorded in January 2026")).toBeInTheDocument()
  })
})
