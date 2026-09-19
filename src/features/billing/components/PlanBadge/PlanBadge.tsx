import { useTranslation } from "react-i18next"
import { findPlanCatalogEntry } from "../../domain/planCatalog"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import type { PlanCode, SubscriptionStatus } from "../../types"
import styles from "./PlanBadge.module.css"

interface PlanBadgeProps {
  plan: PlanCode
  status: SubscriptionStatus
  // Compact: plan name only, no status suffix — used in tight spaces like
  // the navbar where "Pro anual · Pago pendiente" would wrap awkwardly.
  compact?: boolean
}

// Status suffixes for the two non-obvious states — "active" and "free" need
// no suffix, the plan label alone already communicates them.
const STATUS_SUFFIX_KEY: Partial<Record<SubscriptionStatus, "pastDue" | "canceled">> = {
  past_due: "pastDue",
  canceled: "canceled",
}

const STATUS_VARIANT: Partial<Record<SubscriptionStatus, string>> = {
  past_due: styles.warning,
  canceled: styles.muted,
}

const PlanBadge = ({ plan, status, compact }: PlanBadgeProps) => {
  const { t } = useTranslation("app")
  // Plan names come from the translated catalog (billing.json) — the same
  // source PlanCards and the pricing page read, so a rename lands everywhere.
  const catalog = usePlanCatalog()
  const suffixKey = compact ? undefined : STATUS_SUFFIX_KEY[status]
  const suffix = suffixKey ? t(`billing.badge.${suffixKey}`) : undefined
  const variant = STATUS_VARIANT[status] ?? (plan === "free" ? styles.default : styles.success)

  return (
    <span className={`${styles.badge} ${variant} ${compact ? styles.compact : ""}`}>
      {findPlanCatalogEntry(catalog, plan).name}
      {suffix && <span className={styles.suffix}> · {suffix}</span>}
    </span>
  )
}

export default PlanBadge
