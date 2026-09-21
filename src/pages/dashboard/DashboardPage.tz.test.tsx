import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import DashboardPage from "./DashboardPage"
import { formatCurrency } from "../../utils/currency"
import type { AuthState } from "../../features/auth/context/authContext"

// Regression for date-only columns read in Argentina (UTC-3). See
// src/i18n/locale.tz.test.ts for the mechanism; this file checks the
// dashboard's own consequences: a task due TODAY was shown as overdue all
// day, and a payment dated the 1st was counted in the previous month.
const money = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, " ")

beforeAll(() => {
  // TZ is pinned suite-wide in vitest.config.ts (see the guard in locale.tz.test.ts).
  expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(180)
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date(2026, 8, 21, 10, 0)) // 21 Sep 2026, 10:00 local
})
afterAll(() => {
  vi.useRealTimers()
})

let authState: AuthState = { status: "authenticated", session: null, user: { id: "u1" } as AuthState["user"] }
vi.mock("../../features/auth/context/authContext", () => ({ useAuthState: () => authState }))
vi.mock("../../features/clients/services", () => ({ getClients: () => Promise.resolve([]) }))
vi.mock("../../features/projects/services", () => ({ getProjects: () => Promise.resolve([]) }))
const getPaymentsMock = vi.fn()
const getTasksMock = vi.fn()
vi.mock("../../features/payments/services", () => ({ getPayments: () => getPaymentsMock() }))
vi.mock("../../features/tasks/services", () => ({ getTasks: () => getTasksMock() }))

afterEach(() => {
  getPaymentsMock.mockReset()
  getTasksMock.mockReset()
  localStorage.clear()
  authState = { status: "authenticated", session: null, user: { id: "u1" } as AuthState["user"] }
})

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("DashboardPage under UTC-3", () => {
  it("does not mark a task due today as overdue, and shows its real day", async () => {
    getPaymentsMock.mockResolvedValue([])
    getTasksMock.mockResolvedValue([
      { id: "t1", title: "Entregar logo", status: "pendiente", priority: "high", due_date: "2026-09-21" },
    ])
    renderDashboard()

    const item = (await screen.findByText("Entregar logo")).closest("li")!
    expect(item.className).not.toMatch(/taskOverdue/)
    expect(item.textContent).toMatch(/21.sept/)
  })

  it("counts a payment dated the 1st of this month in THIS month's income", async () => {
    getPaymentsMock.mockResolvedValue([
      { id: "p1", amount: 1000, status: "pagado", payment_date: "2026-09-01" },
    ])
    getTasksMock.mockResolvedValue([])
    renderDashboard()

    expect(await screen.findByText(money(1000))).toBeInTheDocument()
  })
})
