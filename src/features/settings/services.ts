import { supabase } from "../../services/supabaseClient"

export interface UserSettings {
  /** Weekly Pro digest email (Monday morning). Default on. */
  weekly_digest: boolean
}

const DEFAULTS: UserSettings = { weekly_digest: true }

// One row per user in public.user_settings (RLS: own row). No row yet means
// the defaults — the server (weekly_digest_recipients) applies the same rule.
export async function getUserSettings(): Promise<UserSettings> {
  const { data, error } = await supabase.from("user_settings").select("weekly_digest").maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { weekly_digest: data.weekly_digest } : DEFAULTS
}

export async function setWeeklyDigest(enabled: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user?.id, weekly_digest: enabled }, { onConflict: "user_id" })
  if (error) throw new Error(error.message)
}
