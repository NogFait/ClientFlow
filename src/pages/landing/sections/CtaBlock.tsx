import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import ScrollReveal from "../../../components/marketing/ScrollReveal/ScrollReveal"
import styles from "./CtaBlock.module.css"

const CtaBlock = () => {
  const { t } = useTranslation("landing")

  return (
    <section className={styles.section}>
      <ScrollReveal className={styles.card}>
        <div className={styles.copy}>
          <h2 className={styles.title}>{t("cta.title")}</h2>
          <p className={styles.subtitle}>{t("cta.subtitle")}</p>
        </div>
        <Link to="/register" className={styles.cta}>
          {t("cta.button")}
          <ArrowRight size={18} />
        </Link>
      </ScrollReveal>
    </section>
  )
}

export default CtaBlock
