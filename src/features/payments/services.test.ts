import { afterEach, describe, expect, it, vi } from "vitest"
import { getPaymentsInRange, getPaymentTotals, getPaymentsByProject } from "./services"

// Mirrors the mocking style of projects/services.test.ts (mock the supabase
// client one level below the service so the service's own query-building
// logic actually runs).
const fromMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

afterEach(() => {
  fromMock.mockReset()
})

function mockRangeChain(result: { data: unknown[] | null; error: { message: string } | null }) {
  const orderMock = vi.fn().mockResolvedValue(result)
  const ltMock = vi.fn().mockReturnValue({ order: orderMock })
  const gteMock = vi.fn().mockReturnValue({ lt: ltMock })
  const selectMock = vi.fn().mockReturnValue({ gte: gteMock })
  fromMock.mockReturnValue({ select: selectMock })
  return { selectMock, gteMock, ltMock, orderMock }
}

function mockTotalsChain(result: { data: unknown[] | null; error: { message: string } | null }) {
  const ltMock = vi.fn().mockResolvedValue(result)
  const gteMock = vi.fn().mockReturnValue({ lt: ltMock })
  const selectMock = vi.fn().mockReturnValue({ gte: gteMock })
  fromMock.mockReturnValue({ select: selectMock })
  return { selectMock, gteMock, ltMock }
}

describe("getPaymentsInRange", () => {
  it("queries pagos within [from, to) ordered by payment_date descending", async () => {
    const rows = [{ id: "p1", amount: 100, payment_date: "2026-09-10", status: "pagado", method: "efectivo" }]
    const { selectMock, gteMock, ltMock, orderMock } = mockRangeChain({ data: rows, error: null })

    const result = await getPaymentsInRange({ from: "2026-09-01", to: "2026-10-01" })

    expect(fromMock).toHaveBeenCalledWith("pagos")
    expect(selectMock).toHaveBeenCalledWith(`*, proyectos (name, clientes (name))`)
    expect(gteMock).toHaveBeenCalledWith("payment_date", "2026-09-01")
    expect(ltMock).toHaveBeenCalledWith("payment_date", "2026-10-01")
    expect(orderMock).toHaveBeenCalledWith("payment_date", { ascending: false })
    expect(result).toEqual(rows)
  })

  it("returns an empty array when there are no payments in range (triangulation)", async () => {
    mockRangeChain({ data: [], error: null })

    const result = await getPaymentsInRange({ from: "2026-01-01", to: "2026-02-01" })

    expect(result).toEqual([])
  })

  it("throws when supabase returns an error", async () => {
    mockRangeChain({ data: null, error: { message: "permission denied for table pagos" } })

    await expect(getPaymentsInRange({ from: "2026-09-01", to: "2026-10-01" })).rejects.toThrow(
      "permission denied for table pagos",
    )
  })
})

describe("getPaymentTotals", () => {
  it("sums paid and pending amounts separately within the range", async () => {
    const rows = [
      { amount: 100, status: "pagado" },
      { amount: 50, status: "pagado" },
      { amount: 30, status: "pendiente" },
    ]
    const { selectMock, gteMock, ltMock } = mockTotalsChain({ data: rows, error: null })

    const result = await getPaymentTotals({ from: "2026-01-01", to: "2027-01-01" })

    expect(fromMock).toHaveBeenCalledWith("pagos")
    expect(selectMock).toHaveBeenCalledWith("amount,status")
    expect(gteMock).toHaveBeenCalledWith("payment_date", "2026-01-01")
    expect(ltMock).toHaveBeenCalledWith("payment_date", "2027-01-01")
    expect(result).toEqual({ paid: 150, pending: 30 })
  })

  it("returns zeros when there are no rows in range (triangulation)", async () => {
    mockTotalsChain({ data: [], error: null })

    const result = await getPaymentTotals({ from: "2026-01-01", to: "2027-01-01" })

    expect(result).toEqual({ paid: 0, pending: 0 })
  })

  it("ignores statuses other than pagado/pendiente defensively", async () => {
    mockTotalsChain({ data: [{ amount: 10, status: "pagado" }, { amount: 999, status: "weird" }], error: null })

    const result = await getPaymentTotals({ from: "2026-01-01", to: "2027-01-01" })

    expect(result).toEqual({ paid: 10, pending: 0 })
  })

  it("throws when supabase returns an error", async () => {
    mockTotalsChain({ data: null, error: { message: "permission denied for table pagos" } })

    await expect(getPaymentTotals({ from: "2026-01-01", to: "2027-01-01" })).rejects.toThrow(
      "permission denied for table pagos",
    )
  })
})

describe("getPaymentsByProject", () => {
  function mockProjectChain(result: { data: unknown[] | null; error: { message: string } | null }) {
    const orderMock = vi.fn().mockResolvedValue(result)
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    fromMock.mockReturnValue({ select: selectMock })
    return { selectMock, eqMock, orderMock }
  }

  it("queries pagos for the project ordered by payment_date descending", async () => {
    const rows = [{ id: "pay1", amount: 100, payment_date: "2026-09-10", status: "pagado", method: "efectivo" }]
    const { selectMock, eqMock, orderMock } = mockProjectChain({ data: rows, error: null })

    const result = await getPaymentsByProject("p1")

    expect(fromMock).toHaveBeenCalledWith("pagos")
    expect(selectMock).toHaveBeenCalledWith("*")
    expect(eqMock).toHaveBeenCalledWith("project_id", "p1")
    expect(orderMock).toHaveBeenCalledWith("payment_date", { ascending: false })
    expect(result).toEqual(rows)
  })

  it("returns an empty array when the project has no payments (triangulation)", async () => {
    mockProjectChain({ data: [], error: null })

    const result = await getPaymentsByProject("p2")

    expect(result).toEqual([])
  })

  it("throws when supabase returns an error", async () => {
    mockProjectChain({ data: null, error: { message: "permission denied for table pagos" } })

    await expect(getPaymentsByProject("p3")).rejects.toThrow("permission denied for table pagos")
  })
})
