import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePaymentForm } from "./usePaymentForm"
import type { IPayment } from "../types"

const createPaymentMock = vi.fn()
const updatePaymentMock = vi.fn()

vi.mock("../services", () => ({
  createPayment: (...args: unknown[]) => createPaymentMock(...args),
  updatePayment: (...args: unknown[]) => updatePaymentMock(...args),
}))

afterEach(() => {
  createPaymentMock.mockReset()
  updatePaymentMock.mockReset()
})

const basePayment: IPayment = { amount: 100, status: "pendiente", method: "efectivo" }

describe("usePaymentForm — lockedProjectId", () => {
  it("forces project_id to the locked project on create, even when the submitted data omits it", async () => {
    createPaymentMock.mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => usePaymentForm(onSuccess, undefined, "p1"))

    await act(async () => {
      await result.current.onSubmit(basePayment)
    })

    expect(createPaymentMock).toHaveBeenCalledWith(expect.objectContaining({ project_id: "p1" }))
  })

  it("forces project_id to the locked project on update too (triangulation: edit path)", async () => {
    updatePaymentMock.mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => usePaymentForm(onSuccess, { ...basePayment, id: "pay1", project_id: "other" }, "p1"))

    await act(async () => {
      await result.current.onSubmit({ ...basePayment, id: "pay1", project_id: "other" })
    })

    expect(updatePaymentMock).toHaveBeenCalledWith("pay1", expect.objectContaining({ project_id: "p1" }))
  })

  it("leaves project_id as submitted when no lockedProjectId is given (unchanged PaymentsPage behavior)", async () => {
    createPaymentMock.mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => usePaymentForm(onSuccess))

    await act(async () => {
      await result.current.onSubmit({ ...basePayment, project_id: "whatever" })
    })

    expect(createPaymentMock).toHaveBeenCalledWith(expect.objectContaining({ project_id: "whatever" }))
  })
})
