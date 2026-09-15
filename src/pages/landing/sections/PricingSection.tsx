import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import { PLAN_CATALOG } from "../../../features/billing/domain/planCatalog"
import styles from "./PricingSection.module.css"

const CTA_LABEL: Record<string, string> = {
  free: "Crear cuenta gratis",
  pro_monthly: "Elegir Pro mensual",
  pro_yearly: "Elegir Pro anual",
}

// Public pricing cards — landing (#precios) and the dedicated /pricing page
// both render straight from PLAN_CATALOG (single source of truth shared
// with the authenticated PlanCards component), so a price change never
// needs to touch markup in more than one place. CTAs always go to /register
// here — auth-aware checkout routing only applies on the standalone
// /pricing page (spec `pricing-page`).
const PricingSection = () => {
  return (
    <div className={styles.grid}>
      {PLAN_CATALOG.map((entry) => (
        <div key={entry.code} className={entry.badge ? `${styles.card} ${styles.recommended}` : styles.card}>
          {entry.badge && <span className={styles.badge}>{entry.badge}</span>}
          <div className={styles.header}>
            <h3 className={styles.name}>{entry.name}</h3>
            <p className={styles.price}>
              {entry.price}
              {entry.priceSuffix && <span className={styles.suffix}>{entry.priceSuffix}</span>}
            </p>
            {entry.note && <span className={styles.note}>{entry.note}</span>}
          </div>
          <ul className={styles.features}>
            {entry.features.map((feature) => (
              <li key={feature} className={styles.feature}>
                <Check size={18} className={styles.featureIcon} />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            to={`/register?plan=${entry.code}`}
            className={entry.code === "free" ? styles.ctaGhost : styles.ctaPrimary}
          >
            {CTA_LABEL[entry.code]}
          </Link>
        </div>
      ))}
    </div>
  )
}

export default PricingSection
