import { supabase } from "../../services/supabaseClient"
import type { Entitlements } from "./types"
import type { PaidPlanCode } from "./ports/BillingProvider"

// Returns null if the user has no subscriptions row (should not happen once
// the signup trigger has run, but the RPC itself can return null — design §1).
export async function getEntitlements(): Promise<Entitlements | null> {
  const { data, error } = await supabase.rpc("get_entitlements")
  if (error) throw new Error(error.message)
  return data as Entitlements | null
}

// Thrown by startCheckout()/openPortal() when the Vercel Function responds
// with a non-2xx status — `code` mirrors the `{ error: code }` body the
// handlers return (api/billing/{checkout,portal}.ts), e.g. "unauthorized",
// "billing_disabled", "invalid_plan", "already_subscribed", "no_billing_customer".
export class BillingApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, status: number) {
    super(code)
    this.name = "BillingApiError"
    this.code = code
    this.status = status
  }
}

interface BillingUrlResponse {
  url?: unknown
  error?: unknown
}

// Shared POST helper for the two billing Vercel Functions: attaches the
// current session's access token as a Bearer header (design §5) and maps any
// non-2xx response to a typed BillingApiError instead of a generic Error.
async function postBillingEndpoint(path: string, body?: Record<string, unknown>): Promise<{ url: string }> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new BillingApiError("unauthorized", 401)

  const response = await fetch(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = (await response.json().catch(() => ({}))) as BillingUrlResponse
  if (!response.ok) {
    const code = typeof payload.error === "string" ? payload.error : "unknown_error"
    throw new BillingApiError(code, response.status)
  }
  if (typeof payload.url !== "string") {
    throw new BillingApiError("invalid_response", response.status)
  }
  return { url: payload.url }
}

// POST /api/billing/checkout — redirects the browser to the Polar-hosted
// checkout session on success (design §3, §5).
export async function startCheckout(plan: PaidPlanCode): Promise<void> {
  const { url } = await postBillingEndpoint("/api/billing/checkout", { plan })
  window.location.assign(url)
}

// POST /api/billing/portal — redirects the browser to the Polar customer
// portal (manage/cancel/change card all happen there, per design §3).
export async function openPortal(): Promise<void> {
  const { url } = await postBillingEndpoint("/api/billing/portal")
  window.location.assign(url)
}
