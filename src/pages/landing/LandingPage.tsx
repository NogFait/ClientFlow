import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import ScrollReveal from "../../components/marketing/ScrollReveal/ScrollReveal"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import Hero from "./sections/Hero"
import ComoFunciona from "./sections/ComoFunciona"
import Features from "./sections/Features"
import PricingSection from "./sections/PricingSection"
import Faq from "./sections/Faq"
import CtaBlock from "./sections/CtaBlock"
import { FAQ_ITEMS } from "../../content/faq"
import styles from "./LandingPage.module.css"

const LandingPage = () => {
  useDocumentTitle(
    "ClientFlow — CRM para freelancers",
    "Tus clientes, proyectos y cobros en un solo lugar. Gratis hasta 3 clientes, sin tarjeta.",
  )

  return (
    <div className={styles.page}>
      <PublicNav />
      <main>
        <Hero />
        <ComoFunciona />
        <Features />

        <section id="precios" className={styles.pricingSection}>
          <div className={styles.pricingInner}>
            <ScrollReveal className={styles.pricingHeading}>
              <span className={styles.eyebrow}>PRECIOS</span>
              <h2 className={styles.title}>Empezá gratis. Pagá cuando crezcas.</h2>
              <p className={styles.subtitle}>
                Un solo plan pago, sin letra chica. Cancelás cuando quieras y seguís hasta el fin del período.
              </p>
            </ScrollReveal>
            <ScrollReveal>
              <PricingSection />
            </ScrollReveal>
            <p className={styles.pricingNote}>Precios en dólares. El cobro lo procesa Polar, con tarjeta internacional.</p>
          </div>
        </section>

        <section id="faq" className={styles.faqSection}>
          <div className={styles.faqInner}>
            <div className={styles.faqHeading}>
              <span className={styles.eyebrow}>PREGUNTAS</span>
              <h2 className={styles.title}>Lo que nos preguntan antes de empezar.</h2>
            </div>
            <ScrollReveal>
              <Faq items={FAQ_ITEMS} />
            </ScrollReveal>
          </div>
        </section>

        <CtaBlock />
      </main>
      <PublicFooter />
    </div>
  )
}

export default LandingPage
