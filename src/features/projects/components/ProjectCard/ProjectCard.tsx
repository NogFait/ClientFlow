import type { MouseEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
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

// "Ver" is the discoverable, accessible way into the project hub
// (/projects/:id): a real <Link>, reachable with Tab. Clicking anywhere else
// on the card is a mouse shortcut to the same place — a convenience, not the
// affordance, so the card itself is not exposed as a link (a role="link" div
// wrapping buttons and a link would nest interactive elements). Editar and
// Eliminar stop propagation so they never trigger the card shortcut.
const ProjectCard = ({ project, onEdit, onDelete }: ProjectCardProps) => {
  const navigate = useNavigate()
  const config = statusConfig[project.status] ?? statusConfig.activo
  const Icon = config.icon
  const statusKey = project.status.charAt(0).toUpperCase() + project.status.slice(1)
  const badgeClass = `badge${statusKey}` as keyof typeof styles
  const hubPath = `/projects/${project.id}`

  const handleCardClick = () => navigate(hubPath)

  const stop = (event: MouseEvent<HTMLElement>) => event.stopPropagation()

  const handleEdit = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onEdit(project)
  }

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onDelete(project)
  }

  return (
    <div className={styles.card} onClick={handleCardClick} data-testid={`project-card-${project.id}`}>
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
        {project.budget != null ? formatCurrency(project.budget) : "—"}
      </p>
      <div className={styles.actions}>
        <Link
          to={hubPath}
          className={`${styles.actionBtn} ${styles.actionView}`}
          aria-label={`Ver proyecto ${project.name}`}
          onClick={stop}
        >
          Ver
        </Link>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={handleEdit}>
          Editar
        </button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={handleDelete}>
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default ProjectCard
