import { Link } from "react-router-dom"
import { ArrowRight, Check } from "lucide-react"
import styles from "./Hero.module.css"

// Above-the-fold hero — reproduces design source Main.dc.html / LandingMobile.dc.html
// verbatim (copy, product-mock numbers, staggered fade-up on mount). Unlike
// the rest of the page this doesn't use scroll-reveal (ScrollReveal/useInView)
// since it's visible immediately on load — the stagger is a plain CSS
// animation with per-element delays (.d1..d5), matching the design tokens
// (700ms, cubic-bezier(.2,.7,.2,1)).
const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <div className={`${styles.reveal} ${styles.d1} ${styles.eyebrow}`}>
            <span className={styles.eyebrowDot} />
            CRM PARA FREELANCERS
          </div>
          <h1 className={`${styles.reveal} ${styles.d2} ${styles.title}`}>
            Tus clientes, proyectos y cobros. En un solo lugar.
          </h1>
          <p className={`${styles.reveal} ${styles.d3} ${styles.subtitle}`}>
            ClientFlow te muestra qué tenés que hacer hoy y cuánto te falta cobrar. Sin planillas, sin perseguir
            pagos de memoria.
          </p>
          <div className={`${styles.reveal} ${styles.d4} ${styles.ctaRow}`}>
            <Link to="/register" className={styles.ctaPrimary}>
              Empezar gratis
              <ArrowRight size={18} />
            </Link>
            <a href="#como" className={styles.ctaGhost}>
              Ver cómo funciona
            </a>
          </div>
          <p className={`${styles.reveal} ${styles.d5} ${styles.note}`}>Gratis hasta 3 clientes. Sin tarjeta.</p>
        </div>

        <div className={styles.mock}>
          <div className={`${styles.reveal} ${styles.d2} ${styles.float} ${styles.mockCardProject}`}>
            <div className={styles.mockCardHeader}>
              <div className={styles.mockCardHeaderText}>
                <span className={`${styles.mockBreadcrumb} ${styles.desktopOnly}`}>Proyectos › Sistema Web</span>
                <span className={styles.mockTitle}>Sistema Web</span>
              </div>
              <span className={styles.mockStatusBadge}>● Activo</span>
            </div>
            <div className={styles.mockStatsRow}>
              <div className={styles.mockStat}>
                <span className={styles.mockStatLabel}>Presupuesto</span>
                <span className={styles.mockStatValue}>$ 600.000</span>
              </div>
              <div className={styles.mockStat}>
                <span className={styles.mockStatLabel}>Cobrado · 62 %</span>
                <span className={styles.mockStatValueGreen}>$ 372.000</span>
                <div className={styles.mockBarTrack}>
                  <div className={styles.mockBarFill} />
                </div>
              </div>
              <div className={`${styles.mockStat} ${styles.desktopOnly}`}>
                <span className={styles.mockStatLabel}>Tareas</span>
                <span className={styles.mockStatValue}>5 / 8 hechas</span>
              </div>
            </div>
            <div className={styles.mockTasks}>
              <div className={styles.mockTaskRow}>
                <span className={styles.mockCheckboxEmpty} />
                <span className={styles.mockTaskLabel}>Diseñar la home</span>
                <span className={styles.mockPriorityBadge}>Alta</span>
                <span className={styles.mockDue}>vence 20 sep</span>
              </div>
              <div className={styles.mockTaskRow}>
                <span className={styles.mockCheckboxDone}>
                  <Check size={12} color="#ffffff" strokeWidth={3} />
                </span>
                <span className={styles.mockTaskLabelDone}>Setup del repositorio</span>
                <span className={styles.mockDue}>hecha</span>
              </div>
            </div>
          </div>

          <div className={`${styles.reveal} ${styles.d4} ${styles.floatLate} ${styles.mockCardPayments} ${styles.desktopOnly}`}>
            <div className={styles.mockPaymentsHeader}>
              <span className={styles.mockPaymentsTitle}>Pagos · Septiembre 2026</span>
              <span className={styles.mockPaymentsNav}>◀ ▶</span>
            </div>
            <div className={styles.mockPaymentsAmount}>
              <span className={styles.mockStatLabel}>Cobrado este mes</span>
              <span className={styles.mockPaymentsValue}>$ 372.000,00</span>
            </div>
            <div className={styles.mockPaymentsList}>
              <div className={styles.mockPaymentsRow}>
                <span>10 sep · Transferencia</span>
                <span className={styles.mockPaid}>Pagado</span>
              </div>
              <div className={styles.mockPaymentsRow}>
                <span>01 oct · Transferencia</span>
                <span className={styles.mockPending}>Pendiente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
