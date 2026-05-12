import { Play, Pause, CheckCircle } from "lucide-react"
import type { IProject } from "../../types"
import styles from "./ProjectCard.module.css"

const statusConfig: Record<string, { label: string; icon: typeof Play }> = {
  activo: { label: "Activo", icon: Play },
  pausado: { label: "Pausado", icon: Pause },
  completo: { label: "Completado", icon: CheckCircle },
}

interface ProjectCardProps {
  project: IProject & { clientes?: { name: string } | null }
  onView: (project: IProject & { clientes?: { name: string } | null }) => void
  onEdit: (project: IProject & { clientes?: { name: string } | null }) => void
  onDelete: (project: IProject) => void
}

const ProjectCard = ({ project, onView, onEdit, onDelete }: ProjectCardProps) => {
  const config = statusConfig[project.status] ?? statusConfig.activo
  const Icon = config.icon
  const statusKey = project.status.charAt(0).toUpperCase() + project.status.slice(1)
  const badgeClass = `badge${statusKey}` as keyof typeof styles

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles[badgeClass]}`}>
          <Icon size={12} />
          {config.label}
        </span>
      </div>
      <h3 className={styles.title}>{project.name}</h3>
      {project.description && <p className={styles.description}>{project.description}</p>}
      <div className={styles.meta}>
        <span>Cliente: {project.clientes?.name ?? "Sin cliente"}</span>
        <span>Inicio: {project.start_date ?? "—"}</span>
      </div>
      <p className={styles.budget}>
        {project.budget != null ? `$${project.budget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
      </p>
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => onView(project)}>Ver</button>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => onEdit(project)}>Editar</button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(project)}>Eliminar</button>
      </div>
    </div>
  )
}

export default ProjectCard
