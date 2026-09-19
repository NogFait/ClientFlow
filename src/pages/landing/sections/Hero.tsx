import { Link } from "react-router-dom"
import { ArrowRight, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import styles from "./Hero.module.css"

// Above-the-fold hero — reproduces design source Main.dc.html / LandingMobile.dc.html
// verbatim (copy, product-mock numbers, staggered fade-up on mount). Unlike
// the rest of the page this doesn't use scroll-reveal (ScrollReveal/useInView)
// since it's visible immediately on load — the stagger is a plain CSS
// animation with per-element delays (.d1..d5), matching the design tokens
// (700ms, cubic-bezier(.2,.7,.2,1)). Copy — including the product mock's
// labels — in landing.json → "hero"; the mock's amounts stay as-is (ARS
// formatting is independent of the UI language).
const Hero = () => {
  const { t } = useTranslation("landing")

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <div className={`${styles.reveal} ${styles.d1} ${styles.eyebrow}`}>
            <span className={styles.eyebrowDot} />
            {t("hero.eyebrow")}
          </div>
          <h1 className={`${styles.reveal} ${styles.d2} ${styles.title}`}>{t("hero.title")}</h1>
          <p className={`${styles.reveal} ${styles.d3} ${styles.subtitle}`}>{t("hero.subtitle")}</p>
          <div className={`${styles.reveal} ${styles.d4} ${styles.ctaRow}`}>
            <Link to="/register" className={styles.ctaPrimary}>
              {t("hero.ctaPrimary")}
              <ArrowRight size={18} />
            </Link>
            <a href="#como" className={styles.ctaGhost}>
              {t("hero.ctaGhost")}
            </a>
          </div>
          <p className={`${styles.reveal} ${styles.d5} ${styles.note}`}>{t("hero.note")}</p>
        </div>

        <div className={styles.mock}>
          <div className={`${styles.reveal} ${styles.d2} ${styles.float} ${styles.mockCardProject}`}>
            <div className={styles.mockCardHeader}>
              <div className={styles.mockCardHeaderText}>
                <span className={`${styles.mockBreadcrumb} ${styles.desktopOnly}`}>{t("hero.mock.breadcrumb")}</span>
                <span className={styles.mockTitle}>{t("hero.mock.projectTitle")}</span>
              </div>
              <span className={styles.mockStatusBadge}>{t("hero.mock.status")}</span>
            </div>
            <div className={styles.mockStatsRow}>
              <div className={styles.mockStat}>
                <span className={styles.mockStatLabel}>{t("hero.mock.budget")}</span>
                <span className={styles.mockStatValue}>$ 600.000</span>
              </div>
              <div className={styles.mockStat}>
                <span className={styles.mockStatLabel}>{t("hero.mock.collected")}</span>
                <span className={styles.mockStatValueGreen}>$ 372.000</span>
                <div className={styles.mockBarTrack}>
                  <div className={styles.mockBarFill} />
                </div>
              </div>
              <div className={`${styles.mockStat} ${styles.desktopOnly}`}>
                <span className={styles.mockStatLabel}>{t("hero.mock.tasks")}</span>
                <span className={styles.mockStatValue}>{t("hero.mock.tasksDone")}</span>
              </div>
            </div>
            <div className={styles.mockTasks}>
              <div className={styles.mockTaskRow}>
                <span className={styles.mockCheckboxEmpty} />
                <span className={styles.mockTaskLabel}>{t("hero.mock.task1")}</span>
                <span className={styles.mockPriorityBadge}>{t("hero.mock.priorityHigh")}</span>
                <span className={styles.mockDue}>{t("hero.mock.due")}</span>
              </div>
              <div className={styles.mockTaskRow}>
                <span className={styles.mockCheckboxDone}>
                  <Check size={12} color="#ffffff" strokeWidth={3} />
                </span>
                <span className={styles.mockTaskLabelDone}>{t("hero.mock.task2")}</span>
                <span className={styles.mockDue}>{t("hero.mock.done")}</span>
              </div>
            </div>
          </div>

          <div className={`${styles.reveal} ${styles.d4} ${styles.floatLate} ${styles.mockCardPayments} ${styles.desktopOnly}`}>
            <div className={styles.mockPaymentsHeader}>
              <span className={styles.mockPaymentsTitle}>{t("hero.mock.paymentsTitle")}</span>
              <span className={styles.mockPaymentsNav}>◀ ▶</span>
            </div>
            <div className={styles.mockPaymentsAmount}>
              <span className={styles.mockStatLabel}>{t("hero.mock.collectedThisMonth")}</span>
              <span className={styles.mockPaymentsValue}>$ 372.000,00</span>
            </div>
            <div className={styles.mockPaymentsList}>
              <div className={styles.mockPaymentsRow}>
                <span>{t("hero.mock.payment1")}</span>
                <span className={styles.mockPaid}>{t("hero.mock.paid")}</span>
              </div>
              <div className={styles.mockPaymentsRow}>
                <span>{t("hero.mock.payment2")}</span>
                <span className={styles.mockPending}>{t("hero.mock.pending")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
