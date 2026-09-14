import { createContext, useContext } from "react"
import type { UseEntitlementsResult } from "../hooks/useEntitlements"

// Split from EntitlementsProvider.tsx so that file only exports the
// component (react-refresh/only-export-components — Fast Refresh breaks
// when a file mixes component and non-component exports).
export const EntitlementsContext = createContext<UseEntitlementsResult | null>(null)

export function useEntitlementsContext(): UseEntitlementsResult {
  const context = useContext(EntitlementsContext)
  if (!context) {
    throw new Error("useEntitlementsContext must be used within an EntitlementsProvider")
  }
  return context
}
