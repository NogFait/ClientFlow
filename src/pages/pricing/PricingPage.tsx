import { useNavigate } from "react-router-dom"
import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import Faq from "../landing/sections/Faq"
import CtaBlock from "../landing/sections/CtaBlock"
import { FAQ_ITEMS } from "../../content/faq"
import { usePageMeta } from "../../hooks/usePageMeta"
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
  usePageMeta({
    title: "Precios — ClientFlow",
    description: "Un solo plan pago, sin letra chica. Empezá gratis y pagá cuando crezcas.",
    path: "/pricing",
  })

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
            <span className={styles.eyebrow}>PRECIOS</span>
            <h1 className={styles.title}>Empezá gratis. Pagá cuando crezcas.</h1>
            <p className={styles.subtitle}>
              Un solo plan pago, sin letra chica. Cancelás cuando quieras y seguís hasta el fin del período.
            </p>
          </div>
        </section>

        <section className={styles.cardsSection}>
          <div className={styles.cardsInner}>
            <PricingToggleCards onSelectPlan={handleSelectPlan} />
            <p className={styles.note}>Precios en dólares. El cobro lo procesa Polar, con tarjeta internacional.</p>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.faqInner}>
            <h2 className={styles.faqTitle}>Lo que nos preguntan antes de empezar.</h2>
            <Faq items={FAQ_ITEMS} />
          </div>
        </section>

        <CtaBlock />
      </main>
      <PublicFooter />
    </div>
  )
}

export default PricingPage
