import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import { resolvePlanCardState } from "../../domain/planCardState"
import type { Entitlements } from "../../types"
import type { PaidPlanCode } from "../../ports/BillingProvider"
import styles from "./PlanCards.module.css"

interface PlanCardsProps {
  entitlements: Entitlements
  onUpgrade: (plan: PaidPlanCode) => void
  loading?: boolean
}

const PlanCards = ({ entitlements, onUpgrade, loading }: PlanCardsProps) => {
  const { t } = useTranslation("app")
  const catalog = usePlanCatalog()

  return (
    <div className={styles.grid}>
      {catalog.map((entry) => {
        const state = resolvePlanCardState(entitlements, entry.code)
        const cardClass = [styles.card, state.isRecommended && styles.recommended, state.isCurrent && styles.current]
          .filter(Boolean)
          .join(" ")

        return (
          <div key={entry.code} className={cardClass}>
            <div className={styles.tags}>
              {state.isCurrent && <span className={styles.tag}>{t("billing.planCards.current")}</span>}
              {state.isRecommended && <span className={styles.tagRecommended}>{t("billing.planCards.recommended")}</span>}
            </div>

            <h3 className={styles.name}>{entry.name}</h3>
            <p className={styles.price}>
              {entry.price}
              {entry.priceSuffix && <span className={styles.suffix}> {entry.priceSuffix}</span>}
            </p>
            {entry.badge && <span className={styles.badge}>{entry.badge}</span>}
            {entry.note && <p className={styles.note}>{entry.note}</p>}

            <ul className={styles.features}>
              {entry.features.map((feature) => (
                <li key={feature} className={styles.feature}>
                  <Check size={16} className={styles.featureIcon} />
                  {feature}
                </li>
              ))}
            </ul>

            {state.cta === "current" && (
              <button type="button" className={styles.ctaCurrent} disabled>
                {t("billing.planCards.currentCta")}
              </button>
            )}
            {state.cta === "upgrade" && (
              <button
                type="button"
                className={styles.cta}
                disabled={loading}
                onClick={() => onUpgrade(entry.code as PaidPlanCode)}
              >
                {t("billing.planCards.choose", { name: entry.name })}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PlanCards
