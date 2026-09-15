import { useId } from "react"
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
          <label htmlFor={projectId} className={styles.label}>Proyecto</label>
          <select id={projectId} className={styles.select} {...register("project_id")}>
            <option value="">Sin proyecto</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={amountId} className={styles.label}>Monto</label>
        <input
          id={amountId}
          className={styles.input}
          type="number"
          step="0.01"
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={errors.amount ? amountErrorId : undefined}
          {...register("amount", { required: true })}
        />
        {errors.amount && <span id={amountErrorId} className={styles.error}>Requerido</span>}
      </div>

      <div>
        <label htmlFor={paymentDateId} className={styles.label}>Fecha de pago</label>
        <input id={paymentDateId} className={styles.input} type="date" {...register("payment_date")} />
      </div>

      <div>
        <label htmlFor={methodId} className={styles.label}>Método</label>
        <select id={methodId} className={styles.select} {...register("method")}>
          {methods.map(m => (
            <option key={m} value={m}>
              {m === "efectivo" ? "Efectivo" : m === "transferencia" ? "Transferencia" : m === "tarjeta" ? "Tarjeta" : "Otro"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={statusId} className={styles.label}>Estado</label>
        <select id={statusId} className={styles.select} {...register("status")}>
          {statuses.map(s => (
            <option key={s} value={s}>
              {s === "pendiente" ? "Pendiente" : "Pagado"}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fullWidth}>
        <label htmlFor={notesId} className={styles.label}>Notas</label>
        <textarea id={notesId} className={styles.textarea} {...register("notes")} />
      </div>

      {errors.root?.serverError && (
        <p className={styles.error}>{errors.root.serverError.message}</p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  )
}

export default PaymentForm
