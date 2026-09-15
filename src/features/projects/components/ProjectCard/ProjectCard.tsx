import type { KeyboardEvent, MouseEvent } from "react"
import { useNavigate } from "react-router-dom"
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

const isActivationKey = (key: string) => key === "Enter" || key === " "

// The whole card is the "ver" affordance and navigates to the project hub
// (/projects/:id) — it replaces the old dedicated "Ver" button/link. The
// card root is exposed as role="link" (not a native <a>, since it wraps
// interactive Editar/Eliminar buttons — nesting a real <a> around buttons
// would be invalid HTML) with keyboard support for Enter/Space. Editar and
// Eliminar stop propagation on both click and keydown so they don't also
// trigger the card's own navigation.
const ProjectCard = ({ project, onEdit, onDelete }: ProjectCardProps) => {
  const navigate = useNavigate()
  const config = statusConfig[project.status] ?? statusConfig.activo
  const Icon = config.icon
  const statusKey = project.status.charAt(0).toUpperCase() + project.status.slice(1)
  const badgeClass = `badge${statusKey}` as keyof typeof styles
  const hubPath = `/projects/${project.id}`

  const goToHub = () => navigate(hubPath)

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isActivationKey(event.key)) return
    event.preventDefault()
    goToHub()
  }

  const handleEdit = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onEdit(project)
  }

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onDelete(project)
  }

  const stopActivationKeyPropagation = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isActivationKey(event.key)) event.stopPropagation()
  }

  return (
    <div
      className={styles.card}
      role="link"
      tabIndex={0}
      aria-label={`Abrir proyecto ${project.name}`}
      onClick={goToHub}
      onKeyDown={handleCardKeyDown}
    >
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
        <button
          className={`${styles.actionBtn} ${styles.actionEdit}`}
          onClick={handleEdit}
          onKeyDown={stopActivationKeyPropagation}
        >
          Editar
        </button>
        <button
          className={`${styles.actionBtn} ${styles.actionDelete}`}
          onClick={handleDelete}
          onKeyDown={stopActivationKeyPropagation}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default ProjectCard
