import type { MouseEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Play, Pause, CheckCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { IProject } from "../../types"
import { formatCurrency } from "../../../../utils/currency"
import styles from "./ProjectCard.module.css"

// Icons per DB status value; labels come from projects.card.status.* (the
// card says "Completado" where the hub's select says "Completo" — kept as
// two keys so neither screen's wording changes).
const statusConfig: Record<string, { key: "activo" | "pausado" | "completo"; icon: typeof Play }> = {
  activo: { key: "activo", icon: Play },
  pausado: { key: "pausado", icon: Pause },
  completo: { key: "completo", icon: CheckCircle },
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
  const { t } = useTranslation("app")
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
          {t(`projects.card.status.${config.key}`)}
        </span>
      </div>
      <h3 className={styles.title}>{project.name}</h3>
      {project.description && <p className={styles.description}>{project.description}</p>}
      <div className={styles.meta}>
        <span>{t("projects.card.client", { name: project.clientes?.name ?? t("projects.noClient") })}</span>
        <span>{t("projects.card.start", { date: project.start_date ?? "—" })}</span>
      </div>
      <p className={styles.budget}>
        {project.budget != null ? formatCurrency(project.budget) : "—"}
      </p>
      <div className={styles.actions}>
        <Link
          to={hubPath}
          className={`${styles.actionBtn} ${styles.actionView}`}
          aria-label={t("projects.card.view", { name: project.name })}
          onClick={stop}
        >
          {t("shared.view")}
        </Link>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={handleEdit}>
          {t("shared.edit")}
        </button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={handleDelete}>
          {t("shared.delete")}
        </button>
      </div>
    </div>
  )
}

export default ProjectCard
