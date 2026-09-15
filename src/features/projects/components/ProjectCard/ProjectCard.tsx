import { Link } from "react-router-dom"
import { Play, Pause, CheckCircle } from "lucide-react"
import type { IProject } from "../../types"
import { formatCurrency } from "../../../../utils/currency"
import styles from "./ProjectCard.module.css"

const statusConfig: Record<string, { label: string; icon: typeof Play }> = {
  activo: { label: "Activo", icon: Play },
  pausado: { label: "Pausado", icon: Pause },
  completo: { label: "Completado", icon: CheckCircle },
}

interface ProjectCardProps {
  project: IProject & { clientes?: { name: string } | null }
  onEdit: (project: IProject & { clientes?: { name: string } | null }) => void
  onDelete: (project: IProject) => void
}

// "Ver" and the title both link straight to the project hub (/projects/:id)
// instead of opening a view-only modal — the hub replaces that modal.
const ProjectCard = ({ project, onEdit, onDelete }: ProjectCardProps) => {
  const config = statusConfig[project.status] ?? statusConfig.activo
  const Icon = config.icon
  const statusKey = project.status.charAt(0).toUpperCase() + project.status.slice(1)
  const badgeClass = `badge${statusKey}` as keyof typeof styles
  const hubPath = `/projects/${project.id}`

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles[badgeClass]}`}>
          <Icon size={12} />
          {config.label}
        </span>
      </div>
      <h3 className={styles.title}>
        <Link to={hubPath}>{project.name}</Link>
      </h3>
      {project.description && <p className={styles.description}>{project.description}</p>}
      <div className={styles.meta}>
        <span>Cliente: {project.clientes?.name ?? "Sin cliente"}</span>
        <span>Inicio: {project.start_date ?? "—"}</span>
      </div>
      <p className={styles.budget}>
        {project.budget != null ? formatCurrency(project.budget) : "—"}
      </p>
      <div className={styles.actions}>
        <Link className={`${styles.actionBtn} ${styles.actionView}`} to={hubPath}>Ver</Link>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => onEdit(project)}>Editar</button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(project)}>Eliminar</button>
      </div>
    </div>
  )
}

export default ProjectCard
