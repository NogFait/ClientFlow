import type { SupabaseClient } from "@supabase/supabase-js"
import type { DigestRepo } from "../../cron/weekly-digest.js"
import type { DigestClient, DigestNote, DigestPayment, DigestTask } from "./buildDigest.js"

// Service-role reads for the digest. Recipients come from the DB function
// so the plan rule is not duplicated here; per-user data is filtered by
// user_id explicitly (service role bypasses RLS).
export function createSupabaseDigestRepo(admin: SupabaseClient): DigestRepo {
  const own = async <T>(table: string, select: string, userId: string): Promise<T[]> => {
    const { data, error } = await admin.from(table).select(select).eq("user_id", userId)
    if (error) throw new Error(error.message)
    return (data ?? []) as T[]
  }

  return {
    async listRecipients() {
      const { data, error } = await admin.rpc("weekly_digest_recipients")
      if (error) throw new Error(error.message)
      return ((data ?? []) as { user_id: string; email: string }[]).map((r) => ({ userId: r.user_id, email: r.email }))
    },

    async loadUserData(userId) {
      const [payments, tasks, clients, notes] = await Promise.all([
        own<DigestPayment>("pagos", "amount, status, payment_date, proyectos (name, clientes (name))", userId),
        own<DigestTask>("tareas", "title, status, due_date, proyectos (name)", userId),
        own<DigestClient>("clientes", "id, name, status, created_at", userId),
        own<DigestNote>("notas", "client_id, note_date", userId),
      ])
      return { payments, tasks, clients, notes }
    },
  }
}
