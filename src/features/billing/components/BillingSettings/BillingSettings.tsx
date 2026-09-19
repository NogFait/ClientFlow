import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import type { Lang } from "../../../../i18n"
import { formatDate } from "../../../../i18n/locale"
import { useCurrentLang } from "../../../../i18n/useCurrentLang"
import PlanBadge from "../PlanBadge/PlanBadge"
import UsageMeter from "../UsageMeter/UsageMeter"
import PlanCards from "../PlanCards/PlanCards"
import type { Entitlements } from "../../types"
import type { PaidPlanCode } from "../../ports/BillingProvider"
import styles from "./BillingSettings.module.css"

interface BillingSettingsProps {
  entitlements: Entitlements
  onUpgrade: (plan: PaidPlanCode) => void
  onManage: () => void
  loading?: boolean
  error?: string | null
}

// Anchored to UTC so the displayed date is deterministic regardless of the
// viewer's (or CI runner's) local timezone — these are server-computed
// instants (current_period_end / grace_until), not viewer-local events.
const LONG_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }

// One status line per subscription state — the reactivation gap this
// redesign fixes: a scheduled-cancel Pro user previously saw only the
// termination date with no way back in, this line now says they still can.
function statusMessage(entitlements: Entitlements, t: TFunction<"app">, lang: Lang): string {
  const { status, cancel_at_period_end, current_period_end, grace_until } = entitlements
  const date = (iso: string) => formatDate(iso, lang, LONG_DATE)

  if (status === "active" && cancel_at_period_end && current_period_end) {
    return t("billing.status.endsOn", { date: date(current_period_end) })
  }
  if (status === "active" && current_period_end) {
    return t("billing.status.renewsOn", { date: date(current_period_end) })
  }
  if (status === "active") {
    return t("billing.status.active")
  }
  if (status === "past_due" && grace_until) {
    return t("billing.status.pastDueUntil", { date: date(grace_until) })
  }
  if (status === "past_due") {
    return t("billing.status.pastDue")
  }
  if (status === "canceled") {
    return t("billing.status.canceled")
  }
  return t("billing.status.free")
}

const BillingSettings = ({ entitlements, onUpgrade, onManage, loading, error }: BillingSettingsProps) => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const { plan, status, limits, usage, cancel_at_period_end } = entitlements

  const isPaying = status === "active" || status === "past_due"
  const showsReactivate = isPaying && cancel_at_period_end

  return (
    <div className={styles.wrapper}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <PlanBadge plan={plan} status={status} />
          <p className={styles.statusLine}>{statusMessage(entitlements, t, lang)}</p>
        </div>

        <div className={styles.meters}>
          <UsageMeter label={t("billing.meters.clients")} used={usage.clientes} limit={limits.clientes} />
          <UsageMeter label={t("billing.meters.projects")} used={usage.proyectos} limit={limits.proyectos} />
        </div>

        {isPaying && (
          <div className={styles.actions}>
            {showsReactivate && (
              <button type="button" className={styles.ctaButton} disabled={loading} onClick={onManage}>
                {t("billing.reactivate")}
              </button>
            )}
            <button
              type="button"
              className={showsReactivate ? styles.manageButtonSecondary : styles.manageButton}
              disabled={loading}
              onClick={onManage}
            >
              {t("billing.manage")}
            </button>
          </div>
        )}
      </section>

      <PlanCards entitlements={entitlements} onUpgrade={onUpgrade} loading={loading} />

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}

export default BillingSettings
