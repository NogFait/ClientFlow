import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../../../i18n/useCurrentLang"
import { formatDateOnly } from "../../../../i18n/locale"
import type { ITask } from "../../types"
import styles from "./TaskCard.module.css"

// Classes per priority value; the label comes from status.priority.* at render.
const priorityConfig: Record<string, { key: "low" | "medium" | "high"; dotClass: string; textClass: string }> = {
  low: { key: "low", dotClass: "priorityLow", textClass: "textLow" },
  medium: { key: "medium", dotClass: "priorityMedium", textClass: "textMedium" },
  high: { key: "high", dotClass: "priorityHigh", textClass: "textHigh" },
}

interface TaskCardProps {
  task: ITask & { proyectos?: { name: string } | null }
  onView: (task: ITask & { proyectos?: { name: string } | null }) => void
  onEdit: (task: ITask & { proyectos?: { name: string } | null }) => void
  onDelete: (task: ITask) => void
}

const TaskCard = ({ task, onView, onEdit, onDelete }: TaskCardProps) => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const priority = priorityConfig[task.priority] ?? priorityConfig.low
  const isDone = task.status === "hechas"

  return (
    <div className={`${styles.card} ${isDone ? styles.cardDone : ""}`}>
      <div className={styles.priority}>
        <span className={`${styles.priorityDot} ${styles[priority.dotClass]}`} />
        <span className={`${styles.priorityLabel} ${styles[priority.textClass]}`}>{t(`status.priority.${priority.key}`)}</span>
      </div>
      <h4 className={`${styles.title} ${isDone ? styles.titleDone : ""}`}>{task.title}</h4>
      {task.description && <p className={`${styles.description} ${isDone ? styles.descDone : ""}`}>{task.description}</p>}
      <div className={styles.meta}>
        <span>
          {task.project_id && task.proyectos?.name
            ? <Link to={`/projects/${task.project_id}`}>{task.proyectos.name}</Link>
            : "—"}
        </span>
        {task.due_date && <span>{t("tasks.due", { date: formatDateOnly(task.due_date, lang) })}</span>}
      </div>
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => onView(task)}>{t("shared.view")}</button>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => onEdit(task)}>{t("shared.edit")}</button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(task)}>{t("shared.delete")}</button>
      </div>
    </div>
  )
}

export default TaskCard