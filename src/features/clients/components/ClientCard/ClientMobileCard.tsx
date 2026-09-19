import { Check, Clock, X, Eye, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { IClient } from "../../types"
import styles from "./ClientMobileCard.module.css"

// Icons per DB status value; the label comes from status.client.* at render.
const statusConfig: Record<string, { key: "activo" | "pendiente" | "inactivo"; icon: typeof Check }> = {
  activo: { key: "activo", icon: Check },
  pendiente: { key: "pendiente", icon: Clock },
  inactivo: { key: "inactivo", icon: X },
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
  const { t } = useTranslation("app")
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
          {t(`status.client.${config.key}`)}
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
          aria-label={t("clients.aria.view", { name: client.name })}
        >
          <Eye size={16} /> {t("shared.view")}
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionEdit}`}
          onClick={() => onEdit(client)}
          aria-label={t("clients.aria.edit", { name: client.name })}
        >
          <Pencil size={16} /> {t("shared.edit")}
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionDelete}`}
          onClick={() => onDelete(client)}
          aria-label={t("clients.aria.delete", { name: client.name })}
        >
          <Trash2 size={16} /> {t("shared.delete")}
        </button>
      </div>
    </div>
  )
}

export default ClientMobileCard
