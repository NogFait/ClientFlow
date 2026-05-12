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
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Nombre</label>
        <input className={styles.input} {...register("name", { required: true })} />
        {errors.name && <span className={styles.error}>Requerido</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input className={styles.input} type="email" {...register("email")} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Celular</label>
        <input className={styles.input} {...register("celular")} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Empresa</label>
        <input className={styles.input} {...register("company")} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Estado</label>
        <select className={styles.select} {...register("status")}>
          {statuses.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
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

export default ClientForm
