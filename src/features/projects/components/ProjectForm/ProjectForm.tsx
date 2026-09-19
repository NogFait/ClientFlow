import { useId } from "react"
import { useTranslation } from "react-i18next"
import type { UseFormRegister, FieldErrors, UseFormHandleSubmit } from "react-hook-form"
import type { IProject, ProjectStatus } from "../../types"
import type { IClient } from "../../../clients/types"
import styles from "./ProjectForm.module.css"

const statuses: ProjectStatus[] = ["activo", "pausado", "completo"]

interface ProjectFormProps {
  register: UseFormRegister<IProject>
  handleSubmit: UseFormHandleSubmit<IProject>
  onSubmit: (data: IProject) => Promise<void>
  errors: FieldErrors<IProject>
  isSubmitting: boolean
  onCancel: () => void
  clients: IClient[]
}

const ProjectForm = ({ register, handleSubmit, onSubmit, errors, isSubmitting, onCancel, clients }: ProjectFormProps) => {
  // Prefixes every field id with a per-mount unique id — this form can be
  // rendered more than once on the same page in principle (create/edit
  // modals), so plain string ids like "project-name" would collide.
  const { t } = useTranslation("app")
  const uid = useId()
  const nameId = `${uid}-name`
  const nameErrorId = `${uid}-name-error`
  const descriptionId = `${uid}-description`
  const clientId = `${uid}-client_id`
  const statusId = `${uid}-status`
  const budgetId = `${uid}-budget`
  const startDateId = `${uid}-start_date`
  const endDateId = `${uid}-end_date`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div>
        <label htmlFor={nameId} className={styles.label}>{t("projects.fields.name")}</label>
        <input
          id={nameId}
          className={styles.input}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
          {...register("name", { required: true })}
        />
        {errors.name && <span id={nameErrorId} className={styles.error}>{t("shared.required")}</span>}
      </div>

      <div>
        <label htmlFor={descriptionId} className={styles.label}>{t("projects.fields.description")}</label>
        <textarea id={descriptionId} className={styles.textarea} {...register("description")} />
      </div>

      <div>
        <label htmlFor={clientId} className={styles.label}>{t("projects.fields.client")}</label>
        <select id={clientId} className={styles.select} {...register("client_id")}>
          <option value="">{t("projects.noClient")}</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={statusId} className={styles.label}>{t("projects.fields.status")}</label>
        <select id={statusId} className={styles.select} {...register("status")}>
          {statuses.map(s => (
            <option key={s} value={s}>{t(`status.project.${s}`)}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={budgetId} className={styles.label}>{t("projects.fields.budget")}</label>
        <input id={budgetId} className={styles.input} type="number" step="0.01" {...register("budget")} />
      </div>

      <div>
        <label htmlFor={startDateId} className={styles.label}>{t("projects.fields.startDate")}</label>
        <input id={startDateId} className={styles.input} type="date" {...register("start_date")} />
      </div>

      <div>
        <label htmlFor={endDateId} className={styles.label}>{t("projects.fields.endDate")}</label>
        <input id={endDateId} className={styles.input} type="date" {...register("end_date")} />
      </div>

      {errors.root?.serverError && (
        <p className={styles.error}>{errors.root.serverError.message}</p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>{t("shared.cancel")}</button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? t("shared.saving") : t("shared.save")}
        </button>
      </div>
    </form>
  )
}

export default ProjectForm
