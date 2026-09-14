import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

const PolarMock = vi.fn()

vi.mock("@polar-sh/sdk", () => ({
  Polar: PolarMock,
}))

const ORIGINAL: Record<string, string | undefined> = {}
const KEYS = [
  "BILLING_PROVIDER",
  "POLAR_ACCESS_TOKEN",
  "POLAR_SERVER",
  "POLAR_PRODUCT_PRO_MONTHLY",
  "POLAR_PRODUCT_PRO_YEARLY",
  "POLAR_WEBHOOK_SECRET",
]

beforeEach(() => {
  vi.resetModules()
  PolarMock.mockClear()
  for (const key of KEYS) {
    ORIGINAL[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of KEYS) {
    if (ORIGINAL[key] === undefined) delete process.env[key]
    else process.env[key] = ORIGINAL[key]
  }
})

describe("getBillingProvider", () => {
  it("defaults to Polar, constructing the SDK client with accessToken and server from env", async () => {
    process.env.POLAR_ACCESS_TOKEN = "token_abc"
    process.env.POLAR_SERVER = "sandbox"
    process.env.POLAR_PRODUCT_PRO_MONTHLY = "prod_m"
    process.env.POLAR_PRODUCT_PRO_YEARLY = "prod_y"

    const { getBillingProvider } = await import("./billing")
    const provider = getBillingProvider()

    expect(PolarMock).toHaveBeenCalledWith({ accessToken: "token_abc", server: "sandbox" })
    expect(provider.id).toBe("polar")
  })

  it("does not require POLAR_WEBHOOK_SECRET to construct the provider (checkout/portal must not depend on it)", async () => {
    process.env.POLAR_ACCESS_TOKEN = "token_abc"
    process.env.POLAR_SERVER = "sandbox"
    process.env.POLAR_PRODUCT_PRO_MONTHLY = "prod_m"
    process.env.POLAR_PRODUCT_PRO_YEARLY = "prod_y"
    // POLAR_WEBHOOK_SECRET intentionally left unset.

    const { getBillingProvider } = await import("./billing")

    expect(() => getBillingProvider()).not.toThrow()
  })

  it("throws for an unsupported BILLING_PROVIDER value", async () => {
    process.env.BILLING_PROVIDER = "mercadopago"

    const { getBillingProvider } = await import("./billing")

    expect(() => getBillingProvider()).toThrow(/mercadopago/)
  })
})
