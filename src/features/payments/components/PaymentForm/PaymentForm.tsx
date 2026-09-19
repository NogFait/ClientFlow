import { useId } from "react"
import { useTranslation } from "react-i18next"
import type { UseFormRegister, FieldErrors, UseFormHandleSubmit } from "react-hook-form"
import type { IPayment, PaymentMethod, PaymentStatus } from "../../types"
import type { IProject } from "../../../projects/types"
import styles from "./PaymentForm.module.css"

const methods: PaymentMethod[] = ["efectivo", "transferencia", "tarjeta", "other"]
const statuses: PaymentStatus[] = ["pendiente", "pagado"]

interface PaymentFormProps {
  register: UseFormRegister<IPayment>
  handleSubmit: UseFormHandleSubmit<IPayment>
  onSubmit: (data: IPayment) => Promise<void>
  errors: FieldErrors<IPayment>
  isSubmitting: boolean
  onCancel: () => void
  projects: IProject[]
  // Set from the project hub's "+ Registrar pago": the project is already
  // known, so the select is hidden entirely rather than shown disabled —
  // usePaymentForm forces project_id to this value on submit (see its own
  // lockedProjectId doc).
  lockedProjectId?: string
}

const PaymentForm = ({ register, handleSubmit, onSubmit, errors, isSubmitting, onCancel, projects, lockedProjectId }: PaymentFormProps) => {
  // Prefixes every field id with a per-mount unique id — this form can be
  // rendered more than once on the same page in principle (create/edit
  // modals), so plain string ids like "payment-amount" would collide.
  const { t } = useTranslation("app")
  const uid = useId()
  const projectId = `${uid}-project_id`
  const amountId = `${uid}-amount`
  const amountErrorId = `${uid}-amount-error`
  const paymentDateId = `${uid}-payment_date`
  const methodId = `${uid}-method`
  const statusId = `${uid}-status`
  const notesId = `${uid}-notes`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {!lockedProjectId && (
        <div>
          <label htmlFor={projectId} className={styles.label}>{t("payments.fields.project")}</label>
          <select id={projectId} className={styles.select} {...register("project_id")}>
            <option value="">{t("payments.noProject")}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={amountId} className={styles.label}>{t("payments.fields.amount")}</label>
        <input
          id={amountId}
          className={styles.input}
          type="number"
          step="0.01"
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={errors.amount ? amountErrorId : undefined}
          {...register("amount", { required: true })}
        />
        {errors.amount && <span id={amountErrorId} className={styles.error}>{t("shared.required")}</span>}
      </div>

      <div>
        <label htmlFor={paymentDateId} className={styles.label}>{t("payments.fields.paymentDate")}</label>
        <input id={paymentDateId} className={styles.input} type="date" {...register("payment_date")} />
      </div>

      <div>
        <label htmlFor={methodId} className={styles.label}>{t("payments.fields.method")}</label>
        <select id={methodId} className={styles.select} {...register("method")}>
          {methods.map(m => (
            <option key={m} value={m}>
              {t(`status.method.${m}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={statusId} className={styles.label}>{t("payments.fields.status")}</label>
        <select id={statusId} className={styles.select} {...register("status")}>
          {statuses.map(s => (
            <option key={s} value={s}>
              {t(`status.payment.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fullWidth}>
        <label htmlFor={notesId} className={styles.label}>{t("payments.fields.notes")}</label>
        <textarea id={notesId} className={styles.textarea} {...register("notes")} />
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

export default PaymentForm
