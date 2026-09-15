import type { PlanCode, SubscriptionStatus } from "../../types"
import styles from "./PlanBadge.module.css"

interface PlanBadgeProps {
  plan: PlanCode
  status: SubscriptionStatus
  // Compact: plan name only, no status suffix — used in tight spaces like
  // the navbar where "Pro anual · Pago pendiente" would wrap awkwardly.
  compact?: boolean
}

const PLAN_LABEL: Record<PlanCode, string> = {
  free: "Free",
  pro_monthly: "Pro mensual",
  pro_yearly: "Pro anual",
}

// Status suffixes for the two non-obvious states — "active" and "free" need
// no suffix, the plan label alone already communicates them.
const STATUS_SUFFIX: Partial<Record<SubscriptionStatus, string>> = {
  past_due: "Pago pendiente",
  canceled: "Cancelado",
}

const STATUS_VARIANT: Partial<Record<SubscriptionStatus, string>> = {
  past_due: styles.warning,
  canceled: styles.muted,
}

const PlanBadge = ({ plan, status, compact }: PlanBadgeProps) => {
  const suffix = compact ? undefined : STATUS_SUFFIX[status]
  const variant = STATUS_VARIANT[status] ?? (plan === "free" ? styles.default : styles.success)

  return (
    <span className={`${styles.badge} ${variant} ${compact ? styles.compact : ""}`}>
      {PLAN_LABEL[plan]}
      {suffix && <span className={styles.suffix}> · {suffix}</span>}
    </span>
  )
}

export default PlanBadge
