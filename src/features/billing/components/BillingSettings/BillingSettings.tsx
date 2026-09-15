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
function formatDateEsAr(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

// One status line per subscription state — the reactivation gap this
// redesign fixes: a scheduled-cancel Pro user previously saw only the
// termination date with no way back in, this line now says they still can.
function statusMessage(entitlements: Entitlements): string {
  const { status, cancel_at_period_end, current_period_end, grace_until } = entitlements

  if (status === "active" && cancel_at_period_end && current_period_end) {
    return `Termina el ${formatDateEsAr(current_period_end)} — podés reactivarlo cuando quieras`
  }
  if (status === "active" && current_period_end) {
    return `Activo · se renueva el ${formatDateEsAr(current_period_end)}`
  }
  if (status === "active") {
    return "Activo"
  }
  if (status === "past_due" && grace_until) {
    return `Pago pendiente · acceso Pro hasta ${formatDateEsAr(grace_until)}`
  }
  if (status === "past_due") {
    return "Pago pendiente"
  }
  if (status === "canceled") {
    return "Sin suscripción activa"
  }
  return "Plan gratuito"
}

const BillingSettings = ({ entitlements, onUpgrade, onManage, loading, error }: BillingSettingsProps) => {
  const { plan, status, limits, usage, cancel_at_period_end } = entitlements

  const isPaying = status === "active" || status === "past_due"
  const showsReactivate = isPaying && cancel_at_period_end

  return (
    <div className={styles.wrapper}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <PlanBadge plan={plan} status={status} />
          <p className={styles.statusLine}>{statusMessage(entitlements)}</p>
        </div>

        <div className={styles.meters}>
          <UsageMeter label="Clientes" used={usage.clientes} limit={limits.clientes} />
          <UsageMeter label="Proyectos" used={usage.proyectos} limit={limits.proyectos} />
        </div>

        {isPaying && (
          <div className={styles.actions}>
            {showsReactivate && (
              <button type="button" className={styles.ctaButton} disabled={loading} onClick={onManage}>
                Reactivar suscripción
              </button>
            )}
            <button
              type="button"
              className={showsReactivate ? styles.manageButtonSecondary : styles.manageButton}
              disabled={loading}
              onClick={onManage}
            >
              Gestionar suscripción
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
