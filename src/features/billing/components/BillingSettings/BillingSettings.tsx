import PlanBadge from "../PlanBadge/PlanBadge"
import UsageMeter from "../UsageMeter/UsageMeter"
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
function formatDateEsAr(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

const BillingSettings = ({ entitlements, onUpgrade, onManage, loading, error }: BillingSettingsProps) => {
  const { plan, status, limits, usage, current_period_end, cancel_at_period_end, grace_until } = entitlements

  const showsUpgrade = status === "free" || status === "canceled"
  const showsManage = status === "active" && !cancel_at_period_end

  return (
    <section className={styles.section}>
      <div className={styles.headerRow}>
        <PlanBadge plan={plan} status={status} />
      </div>

      <div className={styles.meters}>
        <UsageMeter label="Clientes" used={usage.clientes} limit={limits.clientes} />
        <UsageMeter label="Proyectos" used={usage.proyectos} limit={limits.proyectos} />
      </div>

      {status === "active" && cancel_at_period_end && current_period_end && (
        <p className={styles.notice}>Tu plan Pro termina el {formatDateEsAr(current_period_end)}.</p>
      )}

      {status === "past_due" && grace_until && (
        <p className={styles.noticeWarning}>
          Pago pendiente — acceso Pro hasta {formatDateEsAr(grace_until)}.
        </p>
      )}

      {showsUpgrade && (
        <div className={styles.upgradeSection}>
          <p className={styles.upgradeCopy}>Actualizá a Pro para clientes y proyectos ilimitados.</p>
          <div className={styles.ctaGroup}>
            <button
              type="button"
              className={styles.ctaButton}
              disabled={loading}
              onClick={() => onUpgrade("pro_monthly")}
            >
              Pro mensual — USD 12/mes
            </button>
            <button
              type="button"
              className={styles.ctaButtonSecondary}
              disabled={loading}
              onClick={() => onUpgrade("pro_yearly")}
            >
              Pro anual — USD 120/año (2 meses gratis)
            </button>
          </div>
        </div>
      )}

      {showsManage && (
        <button type="button" className={styles.manageButton} disabled={loading} onClick={onManage}>
          Gestionar suscripción
        </button>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </section>
  )
}

export default BillingSettings
