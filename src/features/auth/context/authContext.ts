import { createContext, useContext } from "react"
import type { Session, User } from "@supabase/supabase-js"

// Split from AuthProvider.tsx so that file only exports the component
// (react-refresh/only-export-components — Fast Refresh breaks when a file
// mixes component and non-component exports). Mirrors entitlementsContext.ts.
export type AuthStatus = "loading" | "authenticated" | "anonymous"

export interface AuthState {
  session: Session | null
  user: User | null
  status: AuthStatus
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuthState(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthState must be used within an AuthProvider")
  }
  return context
}
