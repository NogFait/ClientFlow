import { useEffect, useRef, useState } from "react"
import { Navigate, useSearchParams } from "react-router-dom"
import PageHeader from "../../../components/shared/PageHeader/PageHeader"
import Loader from "../../../components/shared/Loader/Loader"
import BillingSettings from "../../../features/billing/components/BillingSettings/BillingSettings"
import { useEntitlementsContext } from "../../../features/billing/context/entitlementsContext"
import { useCheckout } from "../../../features/billing/hooks/useCheckout"
import { BILLING_ENABLED } from "../../../config/features"
import styles from "./BillingSettingsPage.module.css"

// Polar's webhook can lag a few seconds behind the checkout redirect — poll
// get_entitlements() a few times instead of trusting a single fetch right
// after `?checkout=success` (design §3 successUrl, m2 apply-progress notes).
const MAX_REFRESH_ATTEMPTS = 3
const REFRESH_DELAY_MS = 2000

const BillingSettingsPage = () => {
  const [searchParams] = useSearchParams()
  const checkoutStatus = searchParams.get("checkout")
  const { entitlements, loading, refresh } = useEntitlementsContext()
  const { upgrade, manage, loading: checkoutLoading, error: checkoutError } = useCheckout()
  const [updating, setUpdating] = useState(checkoutStatus === "success")
  const startedRef = useRef(false)

  useEffect(() => {
    if (checkoutStatus !== "success" || startedRef.current) return
    startedRef.current = true

    let attempt = 0
    let cancelled = false

    const tick = () => {
      refresh().finally(() => {
        if (cancelled) return
        attempt += 1
        if (attempt < MAX_REFRESH_ATTEMPTS) {
          setTimeout(tick, REFRESH_DELAY_MS)
        } else {
          setUpdating(false)
        }
      })
    }
    tick()

    return () => {
      cancelled = true
    }
  }, [checkoutStatus, refresh])

  if (!BILLING_ENABLED) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div>
      <PageHeader title="Plan y facturación" description="Gestioná tu plan, tu uso y tu método de pago." />

      {updating && <div className={styles.banner}>Actualizando tu plan…</div>}

      {loading || !entitlements ? (
        <div className={styles.loaderSection}>
          <Loader />
        </div>
      ) : (
        <BillingSettings
          entitlements={entitlements}
          onUpgrade={upgrade}
          onManage={manage}
          loading={checkoutLoading}
          error={checkoutError}
        />
      )}
    </div>
  )
}

export default BillingSettingsPage
