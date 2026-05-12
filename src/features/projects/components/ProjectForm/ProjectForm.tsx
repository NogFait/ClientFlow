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
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div>
        <label className={styles.label}>Nombre</label>
        <input className={styles.input} {...register("name", { required: true })} />
        {errors.name && <span className={styles.error}>Requerido</span>}
      </div>

      <div>
        <label className={styles.label}>Descripción</label>
        <textarea className={styles.textarea} {...register("description")} />
      </div>

      <div>
        <label className={styles.label}>Cliente</label>
        <select className={styles.select} {...register("client_id")}>
          <option value="">Sin cliente</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={styles.label}>Estado</label>
        <select className={styles.select} {...register("status")}>
          {statuses.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={styles.label}>Presupuesto</label>
        <input className={styles.input} type="number" step="0.01" {...register("budget")} />
      </div>

      <div>
        <label className={styles.label}>Fecha inicio</label>
        <input className={styles.input} type="date" {...register("start_date")} />
      </div>

      <div>
        <label className={styles.label}>Fecha fin</label>
        <input className={styles.input} type="date" {...register("end_date")} />
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

export default ProjectForm
