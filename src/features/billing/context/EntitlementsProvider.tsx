import type { ReactNode } from "react"
import { useEntitlements } from "../hooks/useEntitlements"
import { EntitlementsContext } from "./entitlementsContext"

// Mounted once inside <Layout/> (design §5) so every protected route shares a
// single fetch of get_entitlements() per session instead of each page
// re-fetching independently.
export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const value = useEntitlements()
  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>
}
