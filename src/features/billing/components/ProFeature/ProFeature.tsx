import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Lock } from "lucide-react"
import { useEntitlementsContext } from "../../context/entitlementsContext"
import { isPro } from "../../domain/entitlements"
import styles from "./ProFeature.module.css"

interface ProFeatureProps {
  title: string
  description: string
  children: ReactNode
}

// Gate for Pro-only UI. Free users see the feature — title, what it does,
// a lock and a "Pro" tag — instead of nothing: seeing what they'd get is
// half the upgrade. Locked while entitlements are still loading so Pro
// content never flashes for a Free user. Server-side features (the
// weekly email) check the plan on the server; this is UI only.
const ProFeature = ({ title, description, children }: ProFeatureProps) => {
  const { t } = useTranslation("app")
  const navigate = useNavigate()
  const { entitlements } = useEntitlementsContext()

  if (entitlements && isPro(entitlements)) return <>{children}</>

  return (
    <section className={styles.locked} aria-label={title}>
      <div className={styles.header}>
        <span className={styles.lockIcon} aria-hidden="true">
          <Lock size={16} />
        </span>
        <div className={styles.text}>
          <h3 className={styles.title}>
            {title} <span className={styles.tag}>{t("billing.proFeature.tag")}</span>
          </h3>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      <div className={styles.footer}>
        <span className={styles.hint}>{t("billing.proFeature.hint")}</span>
        <button type="button" className={styles.cta} onClick={() => navigate("/settings/billing")}>
          {t("billing.proFeature.cta")}
        </button>
      </div>
    </section>
  )
}

export default ProFeature
