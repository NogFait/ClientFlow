import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseAdminEnv } from "./env"

// Service-role client factory (design §3) — bypasses RLS. Only ever used
// server-side (Vercel Functions), never imported by src/**. Memoized so a
// warm Lambda instance reuses one client across invocations.
let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const { url, serviceRoleKey } = getSupabaseAdminEnv()
  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
