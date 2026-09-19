import { useTranslation } from "react-i18next"
import ScrollReveal from "../../../components/marketing/ScrollReveal/ScrollReveal"
import styles from "./ComoFunciona.module.css"

// Copy lives in landing.json → "how" (three numbered steps).
const ComoFunciona = () => {
  const { t } = useTranslation("landing")
  const steps = t("how.steps", { returnObjects: true })

  return (
    <section id="como" className={styles.section}>
      <div className={styles.inner}>
        <ScrollReveal className={styles.heading}>
          <span className={styles.eyebrow}>{t("how.eyebrow")}</span>
          <h2 className={styles.title}>{t("how.title")}</h2>
          <p className={styles.subtitle}>{t("how.subtitle")}</p>
        </ScrollReveal>
        <div className={styles.grid}>
          {steps.map((step, index) => (
            <ScrollReveal key={step.title} className={styles.card}>
              <span className={styles.number}>{index + 1}</span>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardDescription}>{step.description}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ComoFunciona
