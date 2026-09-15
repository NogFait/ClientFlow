import { LayoutDashboard, TrendingUp, KanbanSquare, Smartphone } from "lucide-react"
import ScrollReveal from "../../../components/marketing/ScrollReveal/ScrollReveal"
import styles from "./Features.module.css"

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Un hub por proyecto",
    description:
      "Presupuesto, cobrado, pendiente y tareas en una sola pantalla. Marcás una tarea hecha con un click y la barra se mueve.",
  },
  {
    icon: TrendingUp,
    title: "Ingresos mes a mes",
    description:
      "Navegás por mes, ves cuánto cobraste, cuánto falta y el acumulado del año. La pregunta de diciembre, respondida en septiembre.",
  },
  {
    icon: KanbanSquare,
    title: "Tablero de tareas",
    description:
      "Pendiente, en progreso, hechas. Con prioridad y vencimiento, para saber qué va primero cuando todo parece urgente.",
  },
  {
    icon: Smartphone,
    title: "Funciona en el celular",
    description:
      "Registrás un cobro desde el bar, marcás una tarea desde el colectivo. Todo lo que hacés en la compu, lo hacés en el teléfono.",
  },
]

const Features = () => {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <ScrollReveal className={styles.heading}>
          <span className={styles.eyebrow}>LO QUE HACE POR VOS</span>
          <h2 className={styles.title}>Respuestas, no planillas.</h2>
        </ScrollReveal>
        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <ScrollReveal key={feature.title} className={styles.card}>
              <span className={styles.iconWrapper}>
                <feature.icon size={22} />
              </span>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDescription}>{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
