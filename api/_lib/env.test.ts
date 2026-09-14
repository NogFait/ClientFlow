import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { getBillingProviderId, getPolarEnv, getSupabaseAdminEnv, getWebhookSecret } from "./env.js"

const ALL_KEYS = [
  "POLAR_ACCESS_TOKEN",
  "POLAR_SERVER",
  "POLAR_PRODUCT_PRO_MONTHLY",
  "POLAR_PRODUCT_PRO_YEARLY",
  "POLAR_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BILLING_PROVIDER",
] as const

const originalEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const key of ALL_KEYS) {
    originalEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of ALL_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key]
    else process.env[key] = originalEnv[key]
  }
})

describe("getPolarEnv", () => {
  it("returns the four Polar config values when all are set", () => {
    process.env.POLAR_ACCESS_TOKEN = "token_abc"
    process.env.POLAR_SERVER = "sandbox"
    process.env.POLAR_PRODUCT_PRO_MONTHLY = "prod_m"
    process.env.POLAR_PRODUCT_PRO_YEARLY = "prod_y"

    expect(getPolarEnv()).toEqual({
      accessToken: "token_abc",
      server: "sandbox",
      productProMonthly: "prod_m",
      productProYearly: "prod_y",
    })
  })

  it("throws naming the missing var when POLAR_ACCESS_TOKEN is absent", () => {
    process.env.POLAR_SERVER = "sandbox"
    process.env.POLAR_PRODUCT_PRO_MONTHLY = "prod_m"
    process.env.POLAR_PRODUCT_PRO_YEARLY = "prod_y"

    expect(() => getPolarEnv()).toThrow(/POLAR_ACCESS_TOKEN/)
  })

  it("rejects a POLAR_SERVER value that isn't sandbox or production", () => {
    process.env.POLAR_ACCESS_TOKEN = "token_abc"
    process.env.POLAR_SERVER = "staging"
    process.env.POLAR_PRODUCT_PRO_MONTHLY = "prod_m"
    process.env.POLAR_PRODUCT_PRO_YEARLY = "prod_y"

    expect(() => getPolarEnv()).toThrow(/POLAR_SERVER/)
  })
})

describe("getWebhookSecret", () => {
  it("returns the secret when set", () => {
    process.env.POLAR_WEBHOOK_SECRET = "whsec_123"
    expect(getWebhookSecret()).toBe("whsec_123")
  })

  it("throws naming the missing var when absent", () => {
    expect(() => getWebhookSecret()).toThrow(/POLAR_WEBHOOK_SECRET/)
  })
})

describe("getSupabaseAdminEnv", () => {
  it("returns url and service role key when both are set", () => {
    process.env.SUPABASE_URL = "https://proj.supabase.co"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key"

    expect(getSupabaseAdminEnv()).toEqual({
      url: "https://proj.supabase.co",
      serviceRoleKey: "service-role-key",
    })
  })

  it("throws naming the missing var when SUPABASE_SERVICE_ROLE_KEY is absent", () => {
    process.env.SUPABASE_URL = "https://proj.supabase.co"
    expect(() => getSupabaseAdminEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/)
  })
})

describe("getBillingProviderId", () => {
  it("defaults to 'polar' when BILLING_PROVIDER is unset", () => {
    expect(getBillingProviderId()).toBe("polar")
  })

  it("returns the explicit value when set", () => {
    process.env.BILLING_PROVIDER = "mercadopago"
    expect(getBillingProviderId()).toBe("mercadopago")
  })
})
