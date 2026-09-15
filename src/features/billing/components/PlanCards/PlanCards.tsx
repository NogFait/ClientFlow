import { Check } from "lucide-react"
import { PLAN_CATALOG } from "../../domain/planCatalog"
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
  return (
    <div className={styles.grid}>
      {PLAN_CATALOG.map((entry) => {
        const state = resolvePlanCardState(entitlements, entry.code)
        const cardClass = [styles.card, state.isRecommended && styles.recommended, state.isCurrent && styles.current]
          .filter(Boolean)
          .join(" ")

        return (
          <div key={entry.code} className={cardClass}>
            <div className={styles.tags}>
              {state.isCurrent && <span className={styles.tag}>Plan actual</span>}
              {state.isRecommended && <span className={styles.tagRecommended}>Recomendado</span>}
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
                Tu plan actual
              </button>
            )}
            {state.cta === "upgrade" && (
              <button
                type="button"
                className={styles.cta}
                disabled={loading}
                onClick={() => onUpgrade(entry.code as PaidPlanCode)}
              >
                Elegir {entry.name}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PlanCards
