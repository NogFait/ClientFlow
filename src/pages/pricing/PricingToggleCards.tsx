import { useState } from "react"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { findPlanCatalogEntry } from "../../features/billing/domain/planCatalog"
import { usePlanCatalog } from "../../features/billing/hooks/usePlanCatalog"
import type { PlanCode } from "../../features/billing/types"
import styles from "./PricingToggleCards.module.css"

type Interval = "monthly" | "yearly"

interface PricingToggleCardsProps {
  onSelectPlan: (plan: PlanCode) => void
}

// Dedicated /pricing page comparison: Free (static) + a single Pro card
// whose price/features/CTA switch between the monthly and yearly catalog
// entries via a toggle (spec `pricing-page`: "toggles interval"). Values
// always come from the plan catalog (in the current language) — never
// hardcoded — so a price change in the catalog is reflected here
// automatically.
const PricingToggleCards = ({ onSelectPlan }: PricingToggleCardsProps) => {
  const { t } = useTranslation("landing")
  const catalog = usePlanCatalog()
  const [billingInterval, setBillingInterval] = useState<Interval>("monthly")
  const freeEntry = findPlanCatalogEntry(catalog, "free")
  const proEntry = findPlanCatalogEntry(catalog, billingInterval === "monthly" ? "pro_monthly" : "pro_yearly")

  return (
    <div className={styles.wrapper}>
      <div className={styles.toggle} role="group" aria-label={t("pricing.intervalLabel")}>
        <button
          type="button"
          className={billingInterval === "monthly" ? styles.toggleActive : styles.toggleOption}
          aria-pressed={billingInterval === "monthly"}
          onClick={() => setBillingInterval("monthly")}
        >
          {t("pricing.monthly")}
        </button>
        <button
          type="button"
          className={billingInterval === "yearly" ? styles.toggleActive : styles.toggleOption}
          aria-pressed={billingInterval === "yearly"}
          onClick={() => setBillingInterval("yearly")}
        >
          {t("pricing.yearly")}
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h3 className={styles.name}>{freeEntry.name}</h3>
            <p className={styles.price}>{freeEntry.price}</p>
          </div>
          <ul className={styles.features}>
            {freeEntry.features.map((feature) => (
              <li key={feature} className={styles.feature}>
                <Check size={18} className={styles.featureIcon} />
                {feature}
              </li>
            ))}
          </ul>
          <button type="button" className={styles.ctaGhost} onClick={() => onSelectPlan("free")}>
            {t("pricing.cta.free")}
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
            {billingInterval === "monthly" ? t("pricing.chooseProMonthly") : t("pricing.chooseProYearly")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PricingToggleCards
