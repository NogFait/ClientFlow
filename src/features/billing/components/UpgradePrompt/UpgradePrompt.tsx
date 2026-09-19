import { Trans, useTranslation } from "react-i18next"
import Modal from "../../../../components/shared/Modal/Modal"
import { findPlanCatalogEntry } from "../../domain/planCatalog"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
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

// Presentational only — checkout is wired in M2 (tasks 2.18-2.19). onUpgrade
// is a placeholder callback until then.
const UpgradePrompt = ({ isOpen, resource, limit, current, onClose, onUpgrade }: UpgradePromptProps) => {
  const { t } = useTranslation("app")
  const label = t(`billing.upgradePrompt.resources.${resource}`)
  // Prices come from the plan catalog (single source of truth shared with
  // PlanCards/PlanBadge) instead of being hardcoded here — keeps this CTA in
  // sync automatically if pricing ever changes.
  const catalog = usePlanCatalog()
  const monthly = findPlanCatalogEntry(catalog, "pro_monthly")
  const yearly = findPlanCatalogEntry(catalog, "pro_yearly")

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("billing.upgradePrompt.title")}>
      <div className={styles.content}>
        <p className={styles.message}>
          {/* <1> in the string is the <strong> below — Trans keeps the bold
              span inside a single translatable sentence. */}
          <Trans
            t={t}
            i18nKey="billing.upgradePrompt.message"
            values={{ current, limit, resource: label }}
            components={{ 1: <strong /> }}
          />
        </p>
        <div className={styles.ctaGroup}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => onUpgrade?.("pro_monthly")}
          >
            {t("billing.upgradePrompt.monthly", { price: `${monthly.price}${monthly.priceSuffix}` })}
          </button>
          <button
            type="button"
            className={styles.ctaButtonSecondary}
            onClick={() => onUpgrade?.("pro_yearly")}
          >
            {t("billing.upgradePrompt.yearly", { price: `${yearly.price}${yearly.priceSuffix}` })}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UpgradePrompt
