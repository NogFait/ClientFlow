import { MessageCircle, Table2, KanbanSquare, CalendarDays } from "lucide-react"
import ScrollReveal from "../../../components/marketing/ScrollReveal/ScrollReveal"
import styles from "./PainPoints.module.css"

// The scattered "system" most freelancers already run. Naming it before the
// pitch is the audit's strongest landing suggestion: the visitor recognises
// their own week, then the product reads as the fix rather than as a feature
// list.
const PAINS = [
  { icon: MessageCircle, tool: "WhatsApp", text: "El cliente pidió un cambio en un audio de hace tres semanas." },
  { icon: Table2, tool: "Excel", text: "La planilla de pagos que nunca está actualizada." },
  { icon: KanbanSquare, tool: "Notion o Trello", text: "Las tareas viven en un tablero que abrís cada tanto." },
  { icon: CalendarDays, tool: "Calendario", text: "El vencimiento está en el calendario. El monto, en tu memoria." },
]

const PainPoints = () => {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <ScrollReveal className={styles.heading}>
          <span className={styles.eyebrow}>¿TE PASA ESTO?</span>
          <h2 className={styles.title}>¿Te pasa esto? Tu trabajo, repartido en cuatro apps.</h2>
        </ScrollReveal>
        <div className={styles.grid}>
          {PAINS.map((pain) => (
            <ScrollReveal key={pain.tool} className={styles.card}>
              <span className={styles.iconWrapper}>
                <pain.icon size={20} />
              </span>
              <div className={styles.cardBody}>
                <span className={styles.tool} data-testid="pain-tool">{pain.tool}</span>
                <p className={styles.text}>{pain.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <p className={styles.closing}>
            Ninguna está mal. El problema es que ninguna sabe de las otras. ClientFlow junta clientes, proyectos,
            tareas y cobros en un solo lugar, y te dice qué falta hacer y qué falta cobrar.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}

export default PainPoints
