import { LayoutDashboard, TrendingUp, KanbanSquare, Smartphone } from "lucide-react"
import { useTranslation } from "react-i18next"
import ScrollReveal from "../../../components/marketing/ScrollReveal/ScrollReveal"
import styles from "./Features.module.css"

// Icons are positional: the i-th icon goes with the i-th item of
// landing.json → "features.items" (hub, income, board, phone).
const ICONS = [LayoutDashboard, TrendingUp, KanbanSquare, Smartphone]

const Features = () => {
  const { t } = useTranslation("landing")
  const items = t("features.items", { returnObjects: true })

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <ScrollReveal className={styles.heading}>
          <span className={styles.eyebrow}>{t("features.eyebrow")}</span>
          <h2 className={styles.title}>{t("features.title")}</h2>
        </ScrollReveal>
        <div className={styles.grid}>
          {items.map((feature, index) => {
            const Icon = ICONS[index]
            return (
              <ScrollReveal key={feature.title} className={styles.card}>
                <span className={styles.iconWrapper}>
                  <Icon size={22} />
                </span>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{feature.title}</h3>
                  <p className={styles.cardDescription}>{feature.description}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
