import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

interface UseHasSessionResult {
  hasSession: boolean
  loading: boolean
}

// Lightweight, mount-only session check for PUBLIC pages (landing nav,
// pricing CTA routing) that need to know "is someone logged in" without
// pulling in the full route-guard machinery. Mirrors the existing
// getUser()-in-a-mount-effect pattern used by ProtectedRoute/PublicOnlyRoute
// and Navbar — a reactive app-wide AuthProvider is tracked separately
// (M3 batch b) and can replace this once it lands.
export function useHasSession(): UseHasSessionResult {
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setHasSession(!!data.user))
  }, [])

  return { hasSession: hasSession ?? false, loading: hasSession === null }
}
