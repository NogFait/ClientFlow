import { supabase } from "../../services/supabaseClient"
import type { Entitlements } from "./types"

// Returns null if the user has no subscriptions row (should not happen once
// the signup trigger has run, but the RPC itself can return null — design §1).
export async function getEntitlements(): Promise<Entitlements | null> {
  const { data, error } = await supabase.rpc("get_entitlements")
  if (error) throw new Error(error.message)
  return data as Entitlements | null
}
