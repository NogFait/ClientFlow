import type { VercelRequest, VercelResponse } from "@vercel/node"
import type { AuthenticatedUser, MinimalRequest, MinimalResponse } from "../_lib/auth.js"
import { getUserFromRequest, sendUnauthorized } from "../_lib/auth.js"
import type { BillingRepo } from "../_lib/billingRepo.js"
import { createSupabaseBillingRepo } from "../_lib/billingRepo.js"
import { getBillingProvider } from "../_lib/billing.js"
import { resolveAppOrigin, type HeaderBag } from "../_lib/http.js"
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js"
import type { BillingProvider } from "../../src/features/billing/ports/BillingProvider.js"

export interface PortalRequest extends MinimalRequest {
  method?: string
  headers: HeaderBag
}

export interface PortalHandlerDeps {
  getUser: (req: PortalRequest) => Promise<AuthenticatedUser | null>
  billingProvider: Pick<BillingProvider, "createPortalSession">
  repo: Pick<BillingRepo, "getSubscriptionRow">
}

// POST /api/billing/portal — design §3. Cancel/resume/change-card all happen
// inside the Polar-hosted portal, never in our own UI.
export function createPortalHandler(deps: PortalHandlerDeps) {
  return async function handler(req: PortalRequest, res: MinimalResponse): Promise<void> {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" })
      return
    }

    const user = await deps.getUser(req)
    if (!user) {
      sendUnauthorized(res)
      return
    }

    const row = await deps.repo.getSubscriptionRow(user.userId)
    if (!row?.providerCustomerId) {
      res.status(400).json({ error: "no_billing_customer" })
      return
    }

    const returnUrl = `${resolveAppOrigin(req.headers)}/settings/billing`
    const { url } = await deps.billingProvider.createPortalSession({
      customerId: row.providerCustomerId,
      returnUrl,
    })

    res.status(200).json({ url })
  }
}

// Lazy singleton — see api/billing/checkout.ts for why deps aren't built at
// module-import time (env validation must not run just from importing this file).
let realHandler: ((req: PortalRequest, res: MinimalResponse) => Promise<void>) | null = null

export default async function (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!realHandler) {
    realHandler = createPortalHandler({
      getUser: (r) => getUserFromRequest(r, getSupabaseAdmin()),
      billingProvider: getBillingProvider(),
      repo: createSupabaseBillingRepo(getSupabaseAdmin()),
    })
  }
  await realHandler(req as unknown as PortalRequest, res as unknown as MinimalResponse)
}
