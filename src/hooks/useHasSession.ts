import { useAuthState } from "../features/auth/context/authContext"

interface UseHasSessionResult {
  hasSession: boolean
  loading: boolean
}

// Lightweight read of the app-wide AuthProvider context for PUBLIC pages
// (landing nav, pricing CTA routing) that just need "is someone logged in"
// without the full route-guard machinery. Previously ran its own
// getUser()-in-a-mount-effect (M3a) — now derives from the single
// onAuthStateChange subscription in AuthProvider (M3b task 3.1).
export function useHasSession(): UseHasSessionResult {
  const { status } = useAuthState()
  return { hasSession: status === "authenticated", loading: status === "loading" }
}
