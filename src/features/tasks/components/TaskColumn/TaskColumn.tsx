import type { ITask } from "../../types"
import TaskCard from "../TaskCard/TaskCard"
import styles from "./TaskColumn.module.css"

interface TaskColumnProps {
  title: string
  tasks: (ITask & { proyectos?: { name: string } | null })[]
  onView: (task: ITask & { proyectos?: { name: string } | null }) => void
  onEdit: (task: ITask & { proyectos?: { name: string } | null }) => void
  onDelete: (task: ITask) => void
}

const TaskColumn = ({ title, tasks, onView, onEdit, onDelete }: TaskColumnProps) => {
  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.count}>{tasks.length}</span>
      </div>
      <div className={styles.cards}>
        {tasks.length === 0 && <p className={styles.empty}>Sin tareas</p>}
        {tasks.map(t => (
          <TaskCard key={t.id} task={t} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

export default TaskColumn