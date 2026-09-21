import type { VercelRequest, VercelResponse } from "@vercel/node"
import type { MinimalResponse } from "../_lib/auth.js"
import type { HeaderBag } from "../_lib/http.js"
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js"
import { getCronSecret, getDigestEmailEnv } from "../_lib/env.js"
import { buildWeeklyDigest, type DigestInput } from "../_lib/digest/buildDigest.js"
import { renderDigestEmail } from "../_lib/digest/renderDigest.js"
import { createResendSender, type EmailSender } from "../_lib/digest/resend.js"
import { createSupabaseDigestRepo } from "../_lib/digest/digestRepo.js"

export interface DigestRecipient {
  userId: string
  email: string
}

export interface DigestRepo {
  /** Pro users with the digest on — decided by the DB (weekly_digest_recipients()). */
  listRecipients(): Promise<DigestRecipient[]>
  loadUserData(userId: string): Promise<Omit<DigestInput, "today">>
}

export interface CronRequest {
  method?: string
  headers: HeaderBag
  query?: Record<string, string | string[] | undefined>
}

export interface WeeklyDigestDeps {
  cronSecret: string
  repo: DigestRepo
  send: EmailSender
  /** Local calendar day in Argentina, "YYYY-MM-DD". */
  today: () => string
  appUrl: string
}

// GET /api/cron/weekly-digest — Vercel calls it on the schedule in
// vercel.json with `Authorization: Bearer $CRON_SECRET`. One email per Pro
// user with something to report; a user's failure never aborts the run.
// `?dry=1` renders without sending, for manual verification.
export function createWeeklyDigestHandler(deps: WeeklyDigestDeps) {
  return async function handler(req: CronRequest, res: MinimalResponse): Promise<void> {
    const auth = req.headers.authorization
    const token = Array.isArray(auth) ? auth[0] : auth
    if (token !== `Bearer ${deps.cronSecret}`) {
      res.status(401).json({ error: "unauthorized" })
      return
    }
    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" })
      return
    }

    const dryRun = req.query?.dry === "1"
    const today = deps.today()
    const recipients = await deps.repo.listRecipients()
    let sent = 0
    let skipped = 0
    let failed = 0
    const previews: { to: string; subject: string }[] = []

    for (const recipient of recipients) {
      try {
        const data = await deps.repo.loadUserData(recipient.userId)
        const digest = buildWeeklyDigest({ today, ...data })
        if (!digest) {
          skipped += 1
          continue
        }
        const email = renderDigestEmail(digest, { appUrl: deps.appUrl })
        if (dryRun) {
          previews.push({ to: recipient.email, subject: email.subject })
          continue
        }
        await deps.send({ to: recipient.email, ...email })
        sent += 1
      } catch (error) {
        failed += 1
        console.error("weekly-digest: failed for", recipient.userId, error instanceof Error ? error.message : error)
      }
    }

    res.status(200).json(dryRun ? { recipients: recipients.length, sent, skipped, failed, dryRun: true, previews } : { recipients: recipients.length, sent, skipped, failed })
  }
}

// Today in Argentina regardless of the Lambda's clock (Vercel runs UTC).
export function todayInArgentina(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
}

let realHandler: ((req: CronRequest, res: MinimalResponse) => Promise<void>) | null = null

export default async function (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!realHandler) {
    const { apiKey, from, appUrl } = getDigestEmailEnv()
    realHandler = createWeeklyDigestHandler({
      cronSecret: getCronSecret(),
      repo: createSupabaseDigestRepo(getSupabaseAdmin()),
      send: createResendSender({ apiKey, from }),
      today: todayInArgentina,
      appUrl,
    })
  }
  await realHandler(req as unknown as CronRequest, res)
}
