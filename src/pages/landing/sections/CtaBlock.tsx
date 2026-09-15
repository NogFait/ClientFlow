import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import ScrollReveal from "../../../components/marketing/ScrollReveal/ScrollReveal"
import styles from "./CtaBlock.module.css"

const CtaBlock = () => {
  return (
    <section className={styles.section}>
      <ScrollReveal className={styles.card}>
        <div className={styles.copy}>
          <h2 className={styles.title}>Dejá de perseguir pagos de memoria.</h2>
          <p className={styles.subtitle}>Tu primer cliente cargado en dos minutos. Gratis, sin tarjeta.</p>
        </div>
        <Link to="/register" className={styles.cta}>
          Empezar gratis
          <ArrowRight size={18} />
        </Link>
      </ScrollReveal>
    </section>
  )
}

export default CtaBlock
