import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import ScrollReveal from "../../components/marketing/ScrollReveal/ScrollReveal"
import { usePageMeta } from "../../hooks/usePageMeta"
import JsonLd from "../../components/seo/JsonLd"
import { buildFaqJsonLd } from "../../seo/faqJsonLd"
import Hero from "./sections/Hero"
import ComoFunciona from "./sections/ComoFunciona"
import Features from "./sections/Features"
import PricingSection from "./sections/PricingSection"
import Faq from "./sections/Faq"
import CtaBlock from "./sections/CtaBlock"
import { FAQ_ITEMS } from "../../content/faq"
import styles from "./LandingPage.module.css"

const FAQ_JSON_LD = buildFaqJsonLd(FAQ_ITEMS)

const LandingPage = () => {
  usePageMeta({
    title: "ClientFlow — CRM para freelancers",
    description: "Tus clientes, proyectos y cobros en un solo lugar. Gratis hasta 3 clientes, sin tarjeta.",
    path: "/",
  })

  const { hash } = useLocation()

  // Cold-load deep link (e.g. shared "/#precios" URL): the SPA shell mounts
  // asynchronously after the initial HTML load (React root render happens
  // after the browser's own one-shot scroll-to-hash attempt), so that
  // attempt finds nothing in the DOM yet and silently no-ops — true whether
  // this route is eager or React.lazy. Do it ourselves once the section has
  // actually mounted. In-page anchor clicks (nav links to #precios/#faq) are
  // untouched — native browser behavior already handles those correctly
  // since the target already exists.
  useEffect(() => {
    if (!hash) return
    const target = document.querySelector(hash)
    if (!target) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" })
  }, [hash])

  return (
    <div className={styles.page}>
      <JsonLd data={FAQ_JSON_LD} />
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
