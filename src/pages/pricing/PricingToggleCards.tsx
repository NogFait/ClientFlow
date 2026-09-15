import { useState } from "react"
import { Check } from "lucide-react"
import { getPlanCatalogEntry } from "../../features/billing/domain/planCatalog"
import type { PlanCode } from "../../features/billing/types"
import styles from "./PricingToggleCards.module.css"

type Interval = "monthly" | "yearly"

interface PricingToggleCardsProps {
  onSelectPlan: (plan: PlanCode) => void
}

const FREE_ENTRY = getPlanCatalogEntry("free")

// Dedicated /pricing page comparison: Free (static) + a single Pro card
// whose price/features/CTA switch between the monthly and yearly catalog
// entries via a toggle (spec `pricing-page`: "toggles interval"). Values
// always come from PLAN_CATALOG — never hardcoded — so a price change in
// the catalog is reflected here automatically.
const PricingToggleCards = ({ onSelectPlan }: PricingToggleCardsProps) => {
  const [billingInterval, setBillingInterval] = useState<Interval>("monthly")
  const proEntry = getPlanCatalogEntry(billingInterval === "monthly" ? "pro_monthly" : "pro_yearly")

  return (
    <div className={styles.wrapper}>
      <div className={styles.toggle} role="group" aria-label="Intervalo de facturación">
        <button
          type="button"
          className={billingInterval === "monthly" ? styles.toggleActive : styles.toggleOption}
          aria-pressed={billingInterval === "monthly"}
          onClick={() => setBillingInterval("monthly")}
        >
          Mensual
        </button>
        <button
          type="button"
          className={billingInterval === "yearly" ? styles.toggleActive : styles.toggleOption}
          aria-pressed={billingInterval === "yearly"}
          onClick={() => setBillingInterval("yearly")}
        >
          Anual
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h3 className={styles.name}>{FREE_ENTRY.name}</h3>
            <p className={styles.price}>{FREE_ENTRY.price}</p>
          </div>
          <ul className={styles.features}>
            {FREE_ENTRY.features.map((feature) => (
              <li key={feature} className={styles.feature}>
                <Check size={18} className={styles.featureIcon} />
                {feature}
              </li>
            ))}
          </ul>
          <button type="button" className={styles.ctaGhost} onClick={() => onSelectPlan("free")}>
            Crear cuenta gratis
          </button>
        </div>

        <div className={`${styles.card} ${styles.recommended}`}>
          {billingInterval === "yearly" && proEntry.badge && <span className={styles.badge}>{proEntry.badge}</span>}
          <div className={styles.header}>
            <h3 className={styles.name}>{proEntry.name}</h3>
            <p className={styles.price}>
              {proEntry.price}
              {proEntry.priceSuffix && <span className={styles.suffix}>{proEntry.priceSuffix}</span>}
            </p>
            {proEntry.note && <span className={styles.note}>{proEntry.note}</span>}
          </div>
          <ul className={styles.features}>
            {proEntry.features.map((feature) => (
              <li key={feature} className={styles.feature}>
                <Check size={18} className={styles.featureIcon} />
                {feature}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.ctaPrimary}
            onClick={() => onSelectPlan(billingInterval === "monthly" ? "pro_monthly" : "pro_yearly")}
          >
            Elegir Pro {billingInterval === "monthly" ? "mensual" : "anual"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PricingToggleCards
