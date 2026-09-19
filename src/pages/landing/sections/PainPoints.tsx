import { MessageCircle, Table2, KanbanSquare, CalendarDays } from "lucide-react"
import { useTranslation } from "react-i18next"
import ScrollReveal from "../../../components/marketing/ScrollReveal/ScrollReveal"
import styles from "./PainPoints.module.css"

// The scattered "system" most freelancers already run. Naming it before the
// pitch is the audit's strongest landing suggestion: the visitor recognises
// their own week, then the product reads as the fix rather than as a feature
// list. Copy in landing.json → "pain"; icons are positional (WhatsApp,
// spreadsheet, board, calendar).
const ICONS = [MessageCircle, Table2, KanbanSquare, CalendarDays]

const PainPoints = () => {
  const { t } = useTranslation("landing")
  const pains = t("pain.items", { returnObjects: true })

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <ScrollReveal className={styles.heading}>
          <span className={styles.eyebrow}>{t("pain.eyebrow")}</span>
          <h2 className={styles.title}>{t("pain.title")}</h2>
        </ScrollReveal>
        <div className={styles.grid}>
          {pains.map((pain, index) => {
            const Icon = ICONS[index]
            return (
              <ScrollReveal key={pain.tool} className={styles.card}>
                <span className={styles.iconWrapper}>
                  <Icon size={20} />
                </span>
                <div className={styles.cardBody}>
                  <span className={styles.tool} data-testid="pain-tool">{pain.tool}</span>
                  <p className={styles.text}>{pain.text}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
        <ScrollReveal>
          <p className={styles.closing}>{t("pain.closing")}</p>
        </ScrollReveal>
      </div>
    </section>
  )
}

export default PainPoints
