import { useState } from "react"
import { startCheckout, openPortal, BillingApiError } from "../services"
import type { PaidPlanCode } from "../ports/BillingProvider"

// User-facing Spanish copy for each server error code (api/billing/{checkout,portal}.ts).
const ERROR_MESSAGES: Record<string, string> = {
  billing_disabled: "La facturación no está disponible en este momento.",
  unauthorized: "Tu sesión expiró. Iniciá sesión de nuevo.",
  invalid_plan: "El plan seleccionado no es válido.",
  already_subscribed: "Ya tenés una suscripción Pro activa.",
  missing_email: "Tu cuenta no tiene un email válido para facturar.",
  no_billing_customer: "Todavía no tenés una suscripción para gestionar.",
}
const DEFAULT_ERROR_MESSAGE = "Ocurrió un error. Intentalo de nuevo."

function messageFor(error: unknown): string {
  if (error instanceof BillingApiError) {
    return ERROR_MESSAGES[error.code] ?? DEFAULT_ERROR_MESSAGE
  }
  return DEFAULT_ERROR_MESSAGE
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upgrade = async (plan: PaidPlanCode) => {
    setLoading(true)
    setError(null)
    try {
      await startCheckout(plan)
    } catch (err) {
      setError(messageFor(err))
      setLoading(false)
    }
  }

  const manage = async () => {
    setLoading(true)
    setError(null)
    try {
      await openPortal()
    } catch (err) {
      setError(messageFor(err))
      setLoading(false)
    }
  }

  return { upgrade, manage, loading, error }
}
