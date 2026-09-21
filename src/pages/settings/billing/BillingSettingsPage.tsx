import { useEffect, useRef, useState } from "react"
import { Navigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import PageHeader from "../../../components/shared/PageHeader/PageHeader"
import Loader from "../../../components/shared/Loader/Loader"
import BillingSettings from "../../../features/billing/components/BillingSettings/BillingSettings"
import { useEntitlementsContext } from "../../../features/billing/context/entitlementsContext"
import { useCheckout } from "../../../features/billing/hooks/useCheckout"
import { BILLING_ENABLED } from "../../../config/features"
import ProFeature from "../../../features/billing/components/ProFeature/ProFeature"
import WeeklyDigestToggle from "../../../features/settings/components/WeeklyDigestToggle/WeeklyDigestToggle"
import type { PaidPlanCode } from "../../../features/billing/ports/BillingProvider"
import styles from "./BillingSettingsPage.module.css"

// Polar's webhook can lag a few seconds behind the checkout redirect — poll
// get_entitlements() a few times instead of trusting a single fetch right
// after `?checkout=success` (design §3 successUrl, m2 apply-progress notes).
const MAX_REFRESH_ATTEMPTS = 3
const REFRESH_DELAY_MS = 2000

function isPaidPlanCode(value: string): value is PaidPlanCode {
  return value === "pro_monthly" || value === "pro_yearly"
}

const BillingSettingsPage = () => {
  const { t } = useTranslation("app")
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutStatus = searchParams.get("checkout")
  const planParam = searchParams.get("plan")
  const { entitlements, loading, refresh } = useEntitlementsContext()
  const { upgrade, manage, loading: checkoutLoading, error: checkoutError } = useCheckout()
  const [updating, setUpdating] = useState(checkoutStatus === "success")
  const startedRef = useRef(false)
  const planStartedRef = useRef(false)

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

  // Consumes the plan preselected on /pricing and carried here by
  // ProtectedRoute's pendingPlan redirect (M3b task 3.2): auto-opens
  // checkout for that plan exactly once, then drops the param from the URL
  // so a refresh/back-navigation never re-triggers it.
  useEffect(() => {
    if (!BILLING_ENABLED || planStartedRef.current) return
    if (!planParam || !isPaidPlanCode(planParam)) return
    planStartedRef.current = true

    void upgrade(planParam)
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.delete("plan")
        return next
      },
      { replace: true },
    )
  }, [planParam, upgrade, setSearchParams])

  if (!BILLING_ENABLED) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div>
      <PageHeader
        title={t("billing.title")}
        description={t("billing.description")}
        aside={
          entitlements && !loading ? (
            <ProFeature variant="inline" title={t("billing.weeklyDigest.title")} description={t("billing.weeklyDigest.description")}>
              <WeeklyDigestToggle variant="compact" />
            </ProFeature>
          ) : undefined
        }
      />

      {updating && <div className={styles.banner}>{t("billing.updating")}</div>}

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
