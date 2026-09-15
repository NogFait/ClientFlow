import ScrollReveal from "../../../components/marketing/ScrollReveal/ScrollReveal"
import styles from "./ComoFunciona.module.css"

const STEPS = [
  {
    number: "1",
    title: "Cargá tus clientes",
    description: "Nombre, contacto y estado. Nada más. Cada cliente agrupa todo lo que hacés para él.",
  },
  {
    number: "2",
    title: "Armá proyectos con presupuesto",
    description:
      "Un proyecto por trabajo, con su presupuesto y sus fechas. Ahí viven sus tareas y sus cobros.",
  },
  {
    number: "3",
    title: "Registrá cobros y tareas",
    description:
      "Cada pago que entra y cada tarea que cerrás mueven la barra del proyecto. Ves el avance real, no el que creés.",
  },
]

const ComoFunciona = () => {
  return (
    <section id="como" className={styles.section}>
      <div className={styles.inner}>
        <ScrollReveal className={styles.heading}>
          <span className={styles.eyebrow}>CÓMO FUNCIONA</span>
          <h2 className={styles.title}>Tres pasos y ya estás ordenado.</h2>
          <p className={styles.subtitle}>
            No hay configuración. Cargás lo que ya tenés en la cabeza y ClientFlow lo convierte en un tablero.
          </p>
        </ScrollReveal>
        <div className={styles.grid}>
          {STEPS.map((step) => (
            <ScrollReveal key={step.number} className={styles.card}>
              <span className={styles.number}>{step.number}</span>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardDescription}>{step.description}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ComoFunciona
