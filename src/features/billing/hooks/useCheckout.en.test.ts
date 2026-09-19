import { describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { I18nextProvider } from "react-i18next"
import { createI18n } from "../../../i18n/createI18n"
import { BillingApiError } from "../services"

const startCheckoutMock = vi.fn()

vi.mock("../services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services")>()
  return {
    ...actual,
    startCheckout: (plan: unknown) => startCheckoutMock(plan),
    openPortal: vi.fn(),
  }
})

// A fresh English instance per render — the global Spanish fallback from
// setup.ts is never touched (same rationale as renderWithLang).
function englishWrapper({ children }: { children: ReactNode }) {
  return createElement(I18nextProvider, { i18n: createI18n("en") }, children)
}

describe("useCheckout — English error messages", () => {
  it("maps a known server error code to its English message", async () => {
    startCheckoutMock.mockRejectedValue(new BillingApiError("already_subscribed", 409))
    const { useCheckout } = await import("./useCheckout")
    const { result } = renderHook(() => useCheckout(), { wrapper: englishWrapper })

    await act(async () => {
      await result.current.upgrade("pro_monthly")
    })

    expect(result.current.error).toBe("You already have an active Pro subscription.")
  })

  it("falls back to the English default for an unknown code (triangulation)", async () => {
    startCheckoutMock.mockRejectedValue(new BillingApiError("something_else", 500))
    const { useCheckout } = await import("./useCheckout")
    const { result } = renderHook(() => useCheckout(), { wrapper: englishWrapper })

    await act(async () => {
      await result.current.upgrade("pro_monthly")
    })

    expect(result.current.error).toBe("Something went wrong. Please try again.")
  })
})
