import type { UseFormRegister, FieldErrors, UseFormHandleSubmit } from "react-hook-form"
import type { ITask, TaskStatus, TaskPriority } from "../../types"
import type { IProject } from "../../../projects/types"
import styles from "./TaskForm.module.css"

const statuses: TaskStatus[] = ["pendiente", "en_progreso", "hechas"]
const priorities: TaskPriority[] = ["low", "medium", "high"]

interface TaskFormProps {
  register: UseFormRegister<ITask>
  handleSubmit: UseFormHandleSubmit<ITask>
  onSubmit: (data: ITask) => Promise<void>
  errors: FieldErrors<ITask>
  isSubmitting: boolean
  onCancel: () => void
  projects: IProject[]
}

const TaskForm = ({ register, handleSubmit, onSubmit, errors, isSubmitting, onCancel, projects }: TaskFormProps) => {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Título</label>
        <input 
          className={`${styles.input} ${errors.title ? styles.inputError : ''}`} 
          {...register("title", { required: true })} 
        />
        {errors.title && <span className={styles.error}>Requerido</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Descripción</label>
        <textarea 
          className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`} 
          {...register("description")} 
        />
        {errors.description && <span className={styles.error}>{errors.description?.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Proyecto</label>
        <select 
          className={`${styles.select} ${errors.project_id ? styles.inputError : ''}`} 
          {...register("project_id")} 
        >
          <option value="">Sin proyecto</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.project_id && <span className={styles.error}>{errors.project_id?.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Estado</label>
        <select 
          className={`${styles.select} ${errors.status ? styles.inputError : ''}`} 
          {...register("status")} 
        >
          {statuses.map(s => (
            <option key={s} value={s}>
              {s === "pendiente" ? "Pendiente" : s === "en_progreso" ? "En Progreso" : "Hechas"}
            </option>
          ))}
        </select>
        {errors.status && <span className={styles.error}>{errors.status?.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Prioridad</label>
        <select 
          className={`${styles.select} ${errors.priority ? styles.inputError : ''}`} 
          {...register("priority")} 
        >
          {priorities.map(p => (
            <option key={p} value={p}>
              {p === "low" ? "Baja" : p === "medium" ? "Media" : "Alta"}
            </option>
          ))}
        </select>
        {errors.priority && <span className={styles.error}>{errors.priority?.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Fecha límite</label>
        <input 
          type="date"
          className={`${styles.input} ${errors.due_date ? styles.inputError : ''}`} 
          {...register("due_date")} 
        />
        {errors.due_date && <span className={styles.error}>{errors.due_date?.message}</span>}
      </div>

      {errors.root?.serverError && (
        <p className={styles.error}>{errors.root.serverError.message}</p>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`${styles.submitBtn} ${isSubmitting ? styles.submitBtnDisabled : ''}`}
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  )
}

export default TaskForm