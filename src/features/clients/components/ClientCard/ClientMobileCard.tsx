import { Check, Clock, X, Eye, Pencil, Trash2 } from "lucide-react"
import type { IClient } from "../../types"
import styles from "./ClientMobileCard.module.css"

const statusConfig: Record<string, { label: string; icon: typeof Check }> = {
  activo: { label: "Activo", icon: Check },
  pendiente: { label: "Pendiente", icon: Clock },
  inactivo: { label: "Inactivo", icon: X },
}

interface ClientMobileCardProps {
  client: IClient
  onView: (client: IClient) => void
  onEdit: (client: IClient) => void
  onDelete: (client: IClient) => void
}

// Card representation of a client row for narrow viewports (<768px), where
// the table's six columns don't fit and the action buttons become
// unreachable without horizontal scrolling. Same data as ClientCard, laid
// out vertically with a full-width action row of ≥40px tap targets.
const ClientMobileCard = ({ client, onView, onEdit, onDelete }: ClientMobileCardProps) => {
  const config = statusConfig[client.status] ?? statusConfig.pendiente
  const Icon = config.icon
  const statusKey = client.status.charAt(0).toUpperCase() + client.status.slice(1)
  const badgeClass = `badge${statusKey}` as keyof typeof styles

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.name}>{client.name}</span>
        <span className={`${styles.badge} ${styles[badgeClass]}`}>
          <Icon size={12} />
          {config.label}
        </span>
      </div>
      <div className={styles.details}>
        <span className={styles.detailLine}>{client.email}</span>
        <span className={styles.detailLine}>{client.celular}</span>
        <span className={styles.detailLine}>{client.company}</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionView}`}
          onClick={() => onView(client)}
          aria-label={`Ver a ${client.name}`}
        >
          <Eye size={16} /> Ver
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionEdit}`}
          onClick={() => onEdit(client)}
          aria-label={`Editar a ${client.name}`}
        >
          <Pencil size={16} /> Editar
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionDelete}`}
          onClick={() => onDelete(client)}
          aria-label={`Eliminar a ${client.name}`}
        >
          <Trash2 size={16} /> Eliminar
        </button>
      </div>
    </div>
  )
}

export default ClientMobileCard
