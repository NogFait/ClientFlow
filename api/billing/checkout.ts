import type { VercelRequest, VercelResponse } from "@vercel/node"
import type { AuthenticatedUser, MinimalRequest, MinimalResponse } from "../_lib/auth"
import { getUserFromRequest, sendUnauthorized } from "../_lib/auth"
import type { BillingRepo } from "../_lib/billingRepo"
import { createSupabaseBillingRepo } from "../_lib/billingRepo"
import { getBillingProvider } from "../_lib/billing"
import { resolveAppOrigin, type HeaderBag } from "../_lib/http"
import { getSupabaseAdmin } from "../_lib/supabaseAdmin"
import type { BillingProvider, PaidPlanCode } from "../../src/features/billing/ports/BillingProvider"

export interface CheckoutRequest extends MinimalRequest {
  method?: string
  headers: HeaderBag
  body?: unknown
}

export interface CheckoutHandlerDeps {
  getUser: (req: CheckoutRequest) => Promise<AuthenticatedUser | null>
  billingProvider: Pick<BillingProvider, "ensureCustomer" | "createCheckout">
  repo: Pick<BillingRepo, "getSubscriptionRow" | "setProviderCustomerId">
  isBillingEnabled: () => boolean
}

function isPaidPlan(value: unknown): value is PaidPlanCode {
  return value === "pro_monthly" || value === "pro_yearly"
}

// POST /api/billing/checkout — design §3, spec `billing-checkout`.
export function createCheckoutHandler(deps: CheckoutHandlerDeps) {
  return async function handler(req: CheckoutRequest, res: MinimalResponse): Promise<void> {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" })
      return
    }

    // Defense in depth: the client hides the checkout UI when
    // VITE_BILLING_ENABLED is off, but a direct POST must be refused too
    // (spec "Server refuses checkout when billing disabled").
    if (!deps.isBillingEnabled()) {
      res.status(403).json({ error: "billing_disabled" })
      return
    }

    const user = await deps.getUser(req)
    if (!user) {
      sendUnauthorized(res)
      return
    }

    const body = (req.body ?? {}) as { plan?: unknown }
    if (!isPaidPlan(body.plan)) {
      res.status(400).json({ error: "invalid_plan" })
      return
    }
    const plan = body.plan

    const row = await deps.repo.getSubscriptionRow(user.userId)
    if (row?.status === "active") {
      res.status(409).json({ error: "already_subscribed" })
      return
    }

    if (!user.email) {
      res.status(400).json({ error: "missing_email" })
      return
    }

    let customerId = row?.providerCustomerId ?? null
    if (!customerId) {
      const created = await deps.billingProvider.ensureCustomer({ userId: user.userId, email: user.email })
      customerId = created.customerId
      await deps.repo.setProviderCustomerId(user.userId, "polar", customerId)
    }

    const successUrl = `${resolveAppOrigin(req.headers)}/settings/billing?checkout=success`
    const { url } = await deps.billingProvider.createCheckout({
      customerId,
      userId: user.userId,
      plan,
      successUrl,
    })

    res.status(200).json({ url })
  }
}

// Lazy singleton: constructing real deps validates env vars (getBillingProvider
// -> getPolarEnv) and must NOT happen at module-import time — that would make
// this file unimportable (e.g. from tests, or any other module that only
// wants the named factory export) whenever Polar env vars aren't set yet.
let realHandler: ((req: CheckoutRequest, res: MinimalResponse) => Promise<void>) | null = null

export default async function (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!realHandler) {
    realHandler = createCheckoutHandler({
      getUser: (r) => getUserFromRequest(r, getSupabaseAdmin()),
      billingProvider: getBillingProvider(),
      repo: createSupabaseBillingRepo(getSupabaseAdmin()),
      isBillingEnabled: () => process.env.VITE_BILLING_ENABLED === "true",
    })
  }
  await realHandler(req as unknown as CheckoutRequest, res as unknown as MinimalResponse)
}
