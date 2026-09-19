import { useId } from "react"
import { useTranslation } from "react-i18next"
import type { UseFormRegister, FieldErrors, UseFormHandleSubmit } from "react-hook-form"
import type { IClient, ClientStatus } from "../../types"
import styles from "./ClientForm.module.css"

const statuses: ClientStatus[] = ["pendiente", "activo", "inactivo"]

interface ClientFormProps {
  register: UseFormRegister<IClient>
  handleSubmit: UseFormHandleSubmit<IClient>
  onSubmit: (data: IClient) => Promise<void>
  errors: FieldErrors<IClient>
  isSubmitting: boolean
  onCancel: () => void
}

const ClientForm = ({ register, handleSubmit, onSubmit, errors, isSubmitting, onCancel }: ClientFormProps) => {
  // Prefixes every field id with a per-mount unique id — this form can be
  // rendered more than once on the same page in principle (create/edit
  // modals), so plain string ids like "client-name" would collide.
  const { t } = useTranslation("app")
  const uid = useId()
  const nameId = `${uid}-name`
  const nameErrorId = `${uid}-name-error`
  const emailId = `${uid}-email`
  const celularId = `${uid}-celular`
  const companyId = `${uid}-company`
  const statusId = `${uid}-status`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor={nameId} className={styles.label}>{t("clients.fields.name")}</label>
        <input
          id={nameId}
          className={styles.input}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
          {...register("name", { required: true })}
        />
        {errors.name && <span id={nameErrorId} className={styles.error}>{t("shared.required")}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor={emailId} className={styles.label}>{t("clients.fields.email")}</label>
        <input id={emailId} className={styles.input} type="email" {...register("email")} />
      </div>

      <div className={styles.field}>
        <label htmlFor={celularId} className={styles.label}>{t("clients.fields.phone")}</label>
        <input id={celularId} className={styles.input} {...register("celular")} />
      </div>

      <div className={styles.field}>
        <label htmlFor={companyId} className={styles.label}>{t("clients.fields.company")}</label>
        <input id={companyId} className={styles.input} {...register("company")} />
      </div>

      <div className={styles.field}>
        <label htmlFor={statusId} className={styles.label}>{t("clients.fields.status")}</label>
        <select id={statusId} className={styles.select} {...register("status")}>
          {statuses.map(s => (
            <option key={s} value={s}>{t(`status.client.${s}`)}</option>
          ))}
        </select>
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

export default ClientForm
