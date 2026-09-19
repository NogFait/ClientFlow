import { useId } from "react"
import { useTranslation } from "react-i18next"
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
  // Set from the project hub's "+ Nueva tarea": the project is already known,
  // so the select is hidden entirely rather than shown disabled — useTaskForm
  // forces project_id to this value on submit (see its own lockedProjectId doc).
  lockedProjectId?: string
}

const TaskForm = ({ register, handleSubmit, onSubmit, errors, isSubmitting, onCancel, projects, lockedProjectId }: TaskFormProps) => {
  // Prefixes every field id with a per-mount unique id — this form can be
  // rendered more than once on the same page in principle (create/edit
  // modals), so plain string ids like "task-title" would collide.
  const { t } = useTranslation("app")
  const uid = useId()
  const titleId = `${uid}-title`
  const titleErrorId = `${uid}-title-error`
  const descriptionId = `${uid}-description`
  const descriptionErrorId = `${uid}-description-error`
  const projectId = `${uid}-project_id`
  const projectErrorId = `${uid}-project_id-error`
  const statusId = `${uid}-status`
  const statusErrorId = `${uid}-status-error`
  const priorityId = `${uid}-priority`
  const priorityErrorId = `${uid}-priority-error`
  const dueDateId = `${uid}-due_date`
  const dueDateErrorId = `${uid}-due_date-error`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor={titleId} className={styles.label}>{t("tasks.fields.title")}</label>
        <input
          id={titleId}
          className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? titleErrorId : undefined}
          {...register("title", { required: true })}
        />
        {errors.title && <span id={titleErrorId} className={styles.error}>{t("shared.required")}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor={descriptionId} className={styles.label}>{t("tasks.fields.description")}</label>
        <textarea
          id={descriptionId}
          className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? descriptionErrorId : undefined}
          {...register("description")}
        />
        {errors.description && <span id={descriptionErrorId} className={styles.error}>{errors.description?.message}</span>}
      </div>

      {!lockedProjectId && (
        <div className={styles.field}>
          <label htmlFor={projectId} className={styles.label}>{t("tasks.fields.project")}</label>
          <select
            id={projectId}
            className={`${styles.select} ${errors.project_id ? styles.inputError : ''}`}
            aria-invalid={errors.project_id ? true : undefined}
            aria-describedby={errors.project_id ? projectErrorId : undefined}
            {...register("project_id")}
          >
            <option value="">{t("tasks.noProject")}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.project_id && <span id={projectErrorId} className={styles.error}>{errors.project_id?.message}</span>}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor={statusId} className={styles.label}>{t("tasks.fields.status")}</label>
        <select
          id={statusId}
          className={`${styles.select} ${errors.status ? styles.inputError : ''}`}
          aria-invalid={errors.status ? true : undefined}
          aria-describedby={errors.status ? statusErrorId : undefined}
          {...register("status")}
        >
          {statuses.map(s => (
            <option key={s} value={s}>
              {t(`status.task.${s}`)}
            </option>
          ))}
        </select>
        {errors.status && <span id={statusErrorId} className={styles.error}>{errors.status?.message}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor={priorityId} className={styles.label}>{t("tasks.fields.priority")}</label>
        <select
          id={priorityId}
          className={`${styles.select} ${errors.priority ? styles.inputError : ''}`}
          aria-invalid={errors.priority ? true : undefined}
          aria-describedby={errors.priority ? priorityErrorId : undefined}
          {...register("priority")}
        >
          {priorities.map(p => (
            <option key={p} value={p}>
              {t(`status.priority.${p}`)}
            </option>
          ))}
        </select>
        {errors.priority && <span id={priorityErrorId} className={styles.error}>{errors.priority?.message}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor={dueDateId} className={styles.label}>{t("tasks.fields.dueDate")}</label>
        <input
          id={dueDateId}
          type="date"
          className={`${styles.input} ${errors.due_date ? styles.inputError : ''}`}
          aria-invalid={errors.due_date ? true : undefined}
          aria-describedby={errors.due_date ? dueDateErrorId : undefined}
          {...register("due_date")}
        />
        {errors.due_date && <span id={dueDateErrorId} className={styles.error}>{errors.due_date?.message}</span>}
      </div>

      {errors.root?.serverError && (
        <p className={styles.error}>{errors.root.serverError.message}</p>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          {t("shared.cancel")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${styles.submitBtn} ${isSubmitting ? styles.submitBtnDisabled : ''}`}
        >
          {isSubmitting ? t("shared.saving") : t("shared.save")}
        </button>
      </div>
    </form>
  )
}

export default TaskForm
