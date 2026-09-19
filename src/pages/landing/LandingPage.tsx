import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import ScrollReveal from "../../components/marketing/ScrollReveal/ScrollReveal"
import { usePageMeta } from "../../hooks/usePageMeta"
import { useFaqItems } from "../../hooks/useFaqItems"
import JsonLd from "../../components/seo/JsonLd"
import { buildFaqJsonLd } from "../../seo/faqJsonLd"
import Hero from "./sections/Hero"
import PainPoints from "./sections/PainPoints"
import ComoFunciona from "./sections/ComoFunciona"
import Features from "./sections/Features"
import PricingSection from "./sections/PricingSection"
import Faq from "./sections/Faq"
import CtaBlock from "./sections/CtaBlock"
import { getPageMeta } from "../../content/pageMeta"
import { useCurrentLang } from "../../i18n/useCurrentLang"
import styles from "./LandingPage.module.css"

const LandingPage = () => {
  const { t } = useTranslation("landing")
  const lang = useCurrentLang()
  usePageMeta(getPageMeta("/", lang))

  // FAQ copy and its structured data come from the same translated list,
  // so the JSON-LD a crawler reads at /en is the English FAQ it sees on-page.
  const faqItems = useFaqItems()

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
      <JsonLd data={buildFaqJsonLd(faqItems)} />
      <PublicNav />
      <main>
        <Hero />
        <PainPoints />
        <ComoFunciona />
        <Features />

        {/* Section ids (#precios, #faq, #como) are language-neutral on
            purpose: nav anchors and shared deep links work at / and /en. */}
        <section id="precios" className={styles.pricingSection}>
          <div className={styles.pricingInner}>
            <ScrollReveal className={styles.pricingHeading}>
              <span className={styles.eyebrow}>{t("pricing.eyebrow")}</span>
              <h2 className={styles.title}>{t("pricing.title")}</h2>
              <p className={styles.subtitle}>{t("pricing.subtitle")}</p>
            </ScrollReveal>
            <ScrollReveal>
              <PricingSection />
            </ScrollReveal>
            <p className={styles.pricingNote}>{t("pricing.note")}</p>
          </div>
        </section>

        <section id="faq" className={styles.faqSection}>
          <div className={styles.faqInner}>
            <div className={styles.faqHeading}>
              <span className={styles.eyebrow}>{t("faq.eyebrow")}</span>
              <h2 className={styles.title}>{t("faq.title")}</h2>
            </div>
            <ScrollReveal>
              <Faq items={faqItems} />
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
