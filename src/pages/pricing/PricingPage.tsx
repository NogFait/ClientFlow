import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import Faq from "../landing/sections/Faq"
import CtaBlock from "../landing/sections/CtaBlock"
import { useFaqItems } from "../../hooks/useFaqItems"
import { getPageMeta } from "../../content/pageMeta"
import { usePageMeta } from "../../hooks/usePageMeta"
import { useCurrentLang } from "../../i18n/useCurrentLang"
import { useHasSession } from "../../hooks/useHasSession"
import { useCheckout } from "../../features/billing/hooks/useCheckout"
import { BILLING_ENABLED } from "../../config/features"
import type { PlanCode } from "../../features/billing/types"
import type { PaidPlanCode } from "../../features/billing/ports/BillingProvider"
import PricingToggleCards from "./PricingToggleCards"
import styles from "./PricingPage.module.css"

// Public /pricing — spec `pricing-page`. CTA routing is auth-aware: an
// anonymous visitor is sent to signup with the chosen plan preserved as a
// query param (?plan=pro_monthly|pro_yearly), while an already-authenticated
// visitor skips signup entirely and goes straight into checkout via the
// existing useCheckout().upgrade() (POST /api/billing/checkout). Choosing
// Free while already signed in has nothing to check out, so it just returns
// them to the dashboard instead of back through signup.
const PricingPage = () => {
  const { t } = useTranslation("landing")
  const lang = useCurrentLang()
  usePageMeta(getPageMeta("/pricing", lang))
  const faqItems = useFaqItems()

  const navigate = useNavigate()
  const { hasSession } = useHasSession()
  const { upgrade } = useCheckout()

  const handleSelectPlan = (plan: PlanCode) => {
    if (plan === "free") {
      navigate(hasSession ? "/dashboard" : "/register")
      return
    }

    if (hasSession) {
      // Defense in depth (matches BillingSettingsPage/Sidebar): don't fire a
      // checkout call the server would 403 anyway when billing is flag-gated
      // off — send the user somewhere useful instead.
      if (BILLING_ENABLED) {
        void upgrade(plan as PaidPlanCode)
      } else {
        navigate("/dashboard")
      }
      return
    }

    navigate(`/register?plan=${plan}`)
  }

  return (
    <div className={styles.page}>
      <PublicNav />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.eyebrow}>{t("pricing.eyebrow")}</span>
            <h1 className={styles.title}>{t("pricing.title")}</h1>
            <p className={styles.subtitle}>{t("pricing.subtitle")}</p>
          </div>
        </section>

        <section className={styles.cardsSection}>
          <div className={styles.cardsInner}>
            <PricingToggleCards onSelectPlan={handleSelectPlan} />
            <p className={styles.note}>{t("pricing.note")}</p>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.faqInner}>
            <h2 className={styles.faqTitle}>{t("faq.title")}</h2>
            <Faq items={faqItems} />
          </div>
        </section>

        <CtaBlock />
      </main>
      <PublicFooter />
    </div>
  )
}

export default PricingPage
