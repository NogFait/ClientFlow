import { useEffect } from "react"
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuthState } from "../../features/auth/context/authContext"
import { clearPendingPlan, readPendingPlan } from "../../features/auth/pendingPlan"
import { BILLING_ENABLED } from "../../config/features"

const BILLING_SETTINGS_PATH = "/settings/billing"

export function ProtectedRoute() {
  const { status } = useAuthState()
  const location = useLocation()
  const navigate = useNavigate()

  // Single funnel every authenticated visit passes through: consumes the
  // plan chosen on /pricing (persisted across the register -> login hop by
  // pendingPlan.ts) exactly once, on the first authenticated landing.
  useEffect(() => {
    if (!BILLING_ENABLED) return
    if (status !== "authenticated") return
    if (location.pathname === BILLING_SETTINGS_PATH) return

    const plan = readPendingPlan()
    if (!plan) return

    clearPendingPlan()
    navigate(`${BILLING_SETTINGS_PATH}?plan=${plan}`, { replace: true })
  }, [status, location.pathname, navigate])

  if (status === "loading") return null
  return status === "authenticated" ? <Outlet /> : <Navigate to="/login" replace />
}
