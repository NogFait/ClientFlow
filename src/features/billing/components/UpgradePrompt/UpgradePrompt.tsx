import Modal from "../../../../components/shared/Modal/Modal"
import { getPlanCatalogEntry } from "../../domain/planCatalog"
import type { EntitlementResource, PlanCode } from "../../types"
import styles from "./UpgradePrompt.module.css"

type PaidPlanCode = Exclude<PlanCode, "free">

interface UpgradePromptProps {
  isOpen: boolean
  resource: EntitlementResource
  limit: number
  current: number
  onClose: () => void
  onUpgrade?: (plan: PaidPlanCode) => void
}

const RESOURCE_LABEL: Record<EntitlementResource, string> = {
  clientes: "clientes",
  proyectos: "proyectos",
}

// Presentational only — checkout is wired in M2 (tasks 2.18-2.19). onUpgrade
// is a placeholder callback until then.
const UpgradePrompt = ({ isOpen, resource, limit, current, onClose, onUpgrade }: UpgradePromptProps) => {
  const label = RESOURCE_LABEL[resource]
  // Prices come from planCatalog (single source of truth shared with
  // PlanCards/PlanBadge) instead of being hardcoded here — keeps this CTA in
  // sync automatically if pricing ever changes.
  const monthly = getPlanCatalogEntry("pro_monthly")
  const yearly = getPlanCatalogEntry("pro_yearly")

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alcanzaste el límite de tu plan">
      <div className={styles.content}>
        <p className={styles.message}>
          Llegaste a <strong>{current} / {limit}</strong> {label} del plan Free. Actualizá a Pro para
          agregar {label} sin límite.
        </p>
        <div className={styles.ctaGroup}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => onUpgrade?.("pro_monthly")}
          >
            Mensual — {monthly.price}{monthly.priceSuffix}
          </button>
          <button
            type="button"
            className={styles.ctaButtonSecondary}
            onClick={() => onUpgrade?.("pro_yearly")}
          >
            Anual — {yearly.price}{yearly.priceSuffix}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UpgradePrompt
