// Env validation, scoped per concern rather than one big "validate everything
// at boot" — checkout.ts/portal.ts must keep working even before
// POLAR_WEBHOOK_SECRET exists (it is only set in M2c, once the webhook is
// registered in the Polar dashboard and Polar hands back a secret). Each
// getter throws naming the exact missing var, read lazily by the handler
// that actually needs it.
//
// Deviation from design §3: APP_URL is intentionally NOT validated here —
// success/cancel URLs are derived from the request's own origin
// (`origin` / `x-forwarded-host` headers) instead of a separate env var.

export type PolarServerEnv = "sandbox" | "production"

export interface PolarEnv {
  accessToken: string
  server: PolarServerEnv
  productProMonthly: string
  productProYearly: string
}

export interface SupabaseAdminEnv {
  url: string
  serviceRoleKey: string
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function isPolarServer(value: string): value is PolarServerEnv {
  return value === "sandbox" || value === "production"
}

export function getPolarEnv(): PolarEnv {
  const server = required("POLAR_SERVER")
  if (!isPolarServer(server)) {
    throw new Error(`Invalid POLAR_SERVER: expected "sandbox" or "production", got "${server}"`)
  }

  return {
    accessToken: required("POLAR_ACCESS_TOKEN"),
    server,
    productProMonthly: required("POLAR_PRODUCT_PRO_MONTHLY"),
    productProYearly: required("POLAR_PRODUCT_PRO_YEARLY"),
  }
}

export function getWebhookSecret(): string {
  return required("POLAR_WEBHOOK_SECRET")
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  }
}

export function getBillingProviderId(): string {
  return process.env.BILLING_PROVIDER ?? "polar"
}
