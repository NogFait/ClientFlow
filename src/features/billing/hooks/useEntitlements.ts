import { useCallback, useEffect, useState } from "react"
import { getEntitlements } from "../services"
import type { Entitlements } from "../types"
import { BILLING_ENABLED } from "../../../config/features"

// Returned when VITE_BILLING_ENABLED is off — every resource reads as
// unlimited so canCreate()/remaining() never block and UpgradePrompt never
// renders, without needing a `null`-check fan-out across the app.
const UNLIMITED_ENTITLEMENTS: Entitlements = {
  plan: "pro_yearly",
  status: "active",
  limits: { clientes: null, proyectos: null },
  usage: { clientes: 0, proyectos: 0 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

export interface UseEntitlementsResult {
  entitlements: Entitlements | null
  loading: boolean
  refresh: () => Promise<void>
}

export function useEntitlements(): UseEntitlementsResult {
  // Computed synchronously at mount (not via an effect) so the disabled path
  // never needs to call setState from inside an effect body — React Compiler
  // lint flags that as a cascading-render risk (react-hooks/set-state-in-effect).
  const [entitlements, setEntitlements] = useState<Entitlements | null>(() =>
    BILLING_ENABLED ? null : UNLIMITED_ENTITLEMENTS,
  )
  const [loading, setLoading] = useState(BILLING_ENABLED)

  // Mount fetch lives inline in the effect (same shape as getClients().then(...)
  // elsewhere in this codebase) rather than calling the `refresh` callback
  // below — react-hooks/set-state-in-effect traces into a useCallback identity
  // referenced from an effect and flags its setState calls even after an
  // await; an inline .then() in the effect body itself is the accepted shape.
  useEffect(() => {
    if (!BILLING_ENABLED) return
    getEntitlements().then((data) => {
      setEntitlements(data)
      setLoading(false)
    })
  }, [])

  // Exposed for callers (e.g. after a create/delete) to manually re-fetch —
  // never referenced by the effect above.
  const refresh = useCallback(async () => {
    if (!BILLING_ENABLED) return // state is already correct — see initializer above
    const data = await getEntitlements()
    setEntitlements(data)
    setLoading(false)
  }, [])

  return { entitlements, loading, refresh }
}
