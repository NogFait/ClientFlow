import { useState } from "react"
import { useTranslation } from "react-i18next"
import { startCheckout, openPortal, BillingApiError } from "../services"
import type { PaidPlanCode } from "../ports/BillingProvider"

// Server error codes (api/billing/{checkout,portal}.ts) with a dedicated
// message in app.json's billing.errors; anything else falls back to
// billing.errors.default. Kept as a list (not a Record of strings) so the
// copy stays in the locale files and the mapping is language-agnostic.
const KNOWN_ERROR_CODES = [
  "billing_disabled",
  "unauthorized",
  "invalid_plan",
  "already_subscribed",
  "missing_email",
  "no_billing_customer",
] as const

type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number]

function isKnownErrorCode(code: string): code is KnownErrorCode {
  return (KNOWN_ERROR_CODES as readonly string[]).includes(code)
}

export function checkoutErrorKey(error: unknown): `billing.errors.${KnownErrorCode | "default"}` {
  if (error instanceof BillingApiError && isKnownErrorCode(error.code)) {
    return `billing.errors.${error.code}`
  }
  return "billing.errors.default"
}

export interface UseCheckoutResult {
  upgrade: (plan: PaidPlanCode) => Promise<void>
  manage: () => Promise<void>
  loading: boolean
  error: string | null
}

// Thin wrapper around services.ts for BillingSettings/UpgradePrompt CTAs.
// On success the browser navigates away (window.location.assign inside
// startCheckout/openPortal), so `loading` only needs to be cleared on the
// error path — there is no "success" state to render.
export function useCheckout(): UseCheckoutResult {
  const { t } = useTranslation("app")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upgrade = async (plan: PaidPlanCode) => {
    setLoading(true)
    setError(null)
    try {
      await startCheckout(plan)
    } catch (err) {
      setError(t(checkoutErrorKey(err)))
      setLoading(false)
    }
  }

  const manage = async () => {
    setLoading(true)
    setError(null)
    try {
      await openPortal()
    } catch (err) {
      setError(t(checkoutErrorKey(err)))
      setLoading(false)
    }
  }

  return { upgrade, manage, loading, error }
}
