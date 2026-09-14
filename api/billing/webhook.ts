import type { VercelRequest, VercelResponse } from "@vercel/node"
import type { MinimalResponse } from "../_lib/auth.js"
import type { BillingRepo } from "../_lib/billingRepo.js"
import { createSupabaseBillingRepo } from "../_lib/billingRepo.js"
import { getBillingProvider } from "../_lib/billing.js"
import { readRawBody, type RawBodySource } from "../_lib/rawBody.js"
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js"
import { applySubscriptionEvent, type SubscriptionRow } from "../../src/features/billing/domain/subscription.js"
import { InvalidSignatureError, type BillingProvider } from "../../src/features/billing/ports/BillingProvider.js"

// Vercel must not parse the body as JSON — HMAC verification needs the exact
// original bytes (design §3 "raw body handling").
export const config = { api: { bodyParser: false } }

export interface WebhookHandlerDeps {
  billingProvider: Pick<BillingProvider, "parseWebhook" | "fetchSubscription">
  repo: Pick<
    BillingRepo,
    "recordBillingEvent" | "markEventProcessed" | "getSubscriptionRow" | "applySubscriptionChange" | "findUserIdByProviderCustomerId"
  >
  now: () => Date
}

export interface WebhookResult {
  status: number
  body: unknown
}

function defaultFreeRow(userId: string): SubscriptionRow {
  return {
    userId,
    planCode: "free",
    status: "free",
    provider: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    graceUntil: null,
    // Epoch: guarantees any real provider event is treated as newer.
    updatedAt: new Date(0).toISOString(),
  }
}

function rowsEqual(a: SubscriptionRow, b: SubscriptionRow): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function safeParseJson(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody)
  } catch {
    return null
  }
}

// Core logic, decoupled from the HTTP/stream plumbing so it can be unit
// tested with plain strings — see design §3 webhook steps 1-6 and spec
// `billing-webhooks` for every scenario this implements.
export async function processWebhookRequest(
  rawBody: string,
  headers: Record<string, string | undefined>,
  deps: WebhookHandlerDeps
): Promise<WebhookResult> {
  let event: ReturnType<BillingProvider["parseWebhook"]>
  try {
    event = deps.billingProvider.parseWebhook(rawBody, headers)
  } catch (err) {
    if (err instanceof InvalidSignatureError) {
      return { status: 401, body: { error: "invalid_signature" } }
    }
    throw err
  }

  const recorded = await deps.repo.recordBillingEvent({
    provider: "polar",
    providerEventId: event.eventId,
    type: event.type,
    payload: safeParseJson(rawBody),
  })
  if (recorded.alreadyProcessed) {
    return { status: 200, body: { duplicate: true } }
  }

  if (event.kind === "ignored") {
    await deps.repo.markEventProcessed(recorded.id)
    return { status: 200, body: { ignored: true } }
  }

  // Fetch-then-apply: always trust the provider's CURRENT state over the
  // webhook body's own (possibly out-of-order) snapshot.
  const fresh = await deps.billingProvider.fetchSubscription(event.subscription.providerSubscriptionId)

  const userId = fresh.userId ?? (await deps.repo.findUserIdByProviderCustomerId(fresh.providerCustomerId))
  if (!userId) {
    throw new Error(`Cannot resolve a Supabase user for Polar customer ${fresh.providerCustomerId}`)
  }

  const currentRow = (await deps.repo.getSubscriptionRow(userId)) ?? defaultFreeRow(userId)
  const nextRow = applySubscriptionEvent(currentRow, fresh, deps.now())

  if (rowsEqual(nextRow, currentRow)) {
    // Stale/out-of-order delivery, or a genuine no-op — still record that we
    // saw it (done above) so it's never retried forever, but nothing to write.
    await deps.repo.markEventProcessed(recorded.id)
    return { status: 200, body: { applied: false } }
  }

  await deps.repo.applySubscriptionChange({ billingEventId: recorded.id, row: nextRow })
  return { status: 200, body: { applied: true } }
}

function toSingleValueHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(headers)) {
    result[key] = Array.isArray(value) ? value[0] : value
  }
  return result
}

export interface WebhookRequest extends RawBodySource {
  headers: Record<string, string | string[] | undefined>
}

// POST /api/billing/webhook — never throws: any failure ends in a 500 so
// Polar retries the delivery (spec "DB write failure triggers retry").
// Secrets are never logged; the response body never echoes internal error text.
export function createWebhookHandler(deps: WebhookHandlerDeps) {
  return async function handler(req: WebhookRequest, res: MinimalResponse): Promise<void> {
    try {
      const rawBody = await readRawBody(req)
      const headers = toSingleValueHeaders(req.headers)
      const { status, body } = await processWebhookRequest(rawBody, headers, deps)
      res.status(status).json(body)
    } catch {
      res.status(500).json({ error: "internal_error" })
    }
  }
}

// Lazy singleton — see api/billing/checkout.ts for why deps aren't built at
// module-import time.
let realHandler: ((req: WebhookRequest, res: MinimalResponse) => Promise<void>) | null = null

export default async function (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!realHandler) {
    const repo = createSupabaseBillingRepo(getSupabaseAdmin())
    realHandler = createWebhookHandler({
      billingProvider: getBillingProvider(),
      repo,
      now: () => new Date(),
    })
  }
  await realHandler(req as unknown as WebhookRequest, res as unknown as MinimalResponse)
}
