import type { ITask } from "../../types"
import styles from "./TaskCard.module.css"

const priorityConfig: Record<string, { label: string; dotClass: string; textClass: string }> = {
  low: { label: "Baja", dotClass: "priorityLow", textClass: "textLow" },
  medium: { label: "Media", dotClass: "priorityMedium", textClass: "textMedium" },
  high: { label: "Alta", dotClass: "priorityHigh", textClass: "textHigh" },
}

interface TaskCardProps {
  task: ITask & { proyectos?: { name: string } | null }
  onView: (task: ITask & { proyectos?: { name: string } | null }) => void
  onEdit: (task: ITask & { proyectos?: { name: string } | null }) => void
  onDelete: (task: ITask) => void
}

const TaskCard = ({ task, onView, onEdit, onDelete }: TaskCardProps) => {
  const priority = priorityConfig[task.priority] ?? priorityConfig.low
  const isDone = task.status === "hechas"

  return (
    <div className={`${styles.card} ${isDone ? styles.cardDone : ""}`}>
      <div className={styles.priority}>
        <span className={`${styles.priorityDot} ${styles[priority.dotClass]}`} />
        <span className={`${styles.priorityLabel} ${styles[priority.textClass]}`}>{priority.label}</span>
      </div>
      <h4 className={`${styles.title} ${isDone ? styles.titleDone : ""}`}>{task.title}</h4>
      {task.description && <p className={`${styles.description} ${isDone ? styles.descDone : ""}`}>{task.description}</p>}
      <div className={styles.meta}>
        <span>{task.proyectos?.name ?? "—"}</span>
        {task.due_date && <span>Vence: {new Date(task.due_date).toLocaleDateString()}</span>}
      </div>
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => onView(task)}>Ver</button>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => onEdit(task)}>Editar</button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(task)}>Eliminar</button>
      </div>
    </div>
  )
}

export default TaskCard