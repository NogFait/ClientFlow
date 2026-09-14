import { Polar } from "@polar-sh/sdk"
import type { BillingProvider } from "../../src/features/billing/ports/BillingProvider.js"
import { getBillingProviderId, getPolarEnv, getWebhookSecret } from "./env.js"
import { PolarBillingProvider } from "./polar/PolarBillingProvider.js"

// Provider selection (design §2/§3) — switches on BILLING_PROVIDER, default
// "polar". getWebhookSecret is passed as a thunk, not called here: checkout
// and portal requests construct a provider too, and must keep working before
// POLAR_WEBHOOK_SECRET exists (only set in M2c).
export function getBillingProvider(): BillingProvider {
  const providerId = getBillingProviderId()

  switch (providerId) {
    case "polar": {
      const env = getPolarEnv()
      const client = new Polar({ accessToken: env.accessToken, server: env.server })
      return new PolarBillingProvider(client, env, getWebhookSecret)
    }
    default:
      throw new Error(`Unsupported BILLING_PROVIDER: ${providerId}`)
  }
}
