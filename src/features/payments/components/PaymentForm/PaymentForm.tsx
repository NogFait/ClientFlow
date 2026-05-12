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
}

const PaymentForm = ({ register, handleSubmit, onSubmit, errors, isSubmitting, onCancel, projects }: PaymentFormProps) => {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div>
        <label className={styles.label}>Proyecto</label>
        <select className={styles.select} {...register("project_id")}>
          <option value="">Sin proyecto</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={styles.label}>Monto</label>
        <input className={styles.input} type="number" step="0.01" {...register("amount", { required: true })} />
        {errors.amount && <span className={styles.error}>Requerido</span>}
      </div>

      <div>
        <label className={styles.label}>Fecha de pago</label>
        <input className={styles.input} type="date" {...register("payment_date")} />
      </div>

      <div>
        <label className={styles.label}>Método</label>
        <select className={styles.select} {...register("method")}>
          {methods.map(m => (
            <option key={m} value={m}>
              {m === "efectivo" ? "Efectivo" : m === "transferencia" ? "Transferencia" : m === "tarjeta" ? "Tarjeta" : "Otro"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={styles.label}>Estado</label>
        <select className={styles.select} {...register("status")}>
          {statuses.map(s => (
            <option key={s} value={s}>
              {s === "pendiente" ? "Pendiente" : "Pagado"}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fullWidth}>
        <label className={styles.label}>Notas</label>
        <textarea className={styles.textarea} {...register("notes")} />
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
