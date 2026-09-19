import { Check, Clock, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { IClient } from "../../types"
import styles from "./ClientCard.module.css"

// Icons per DB status value; the label comes from status.client.* at render.
const statusConfig: Record<string, { key: "activo" | "pendiente" | "inactivo"; icon: typeof Check }> = {
  activo: { key: "activo", icon: Check },
  pendiente: { key: "pendiente", icon: Clock },
  inactivo: { key: "inactivo", icon: X },
}

interface ClientCardProps {
  client: IClient
  onView: (client: IClient) => void
  onEdit: (client: IClient) => void
  onDelete: (client: IClient) => void
}

const ClientCard = ({ client, onView, onEdit, onDelete }: ClientCardProps) => {
  const { t } = useTranslation("app")
  const config = statusConfig[client.status] ?? statusConfig.pendiente
  const Icon = config.icon
  const statusKey = client.status.charAt(0).toUpperCase() + client.status.slice(1)
  const badgeClass = `badge${statusKey}` as keyof typeof styles

  return (
    <tr className={styles.row}>
      <td className={styles.cellName}>{client.name}</td>
      <td className={styles.cell}>{client.email}</td>
      <td className={styles.cell}>{client.celular}</td>
      <td className={styles.cell}>{client.company}</td>
      <td className={styles.cell}>
        <span className={`${styles.badge} ${styles[badgeClass]}`}>
          <Icon size={12} />
          {t(`status.client.${config.key}`)}
        </span>
      </td>
      <td className={styles.cellActions}>
        <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => onView(client)}>
          {t("shared.view")}
        </button>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => onEdit(client)}>
          {t("shared.edit")}
        </button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(client)}>
          {t("shared.delete")}
        </button>
      </td>
    </tr>
  )
}

export default ClientCard
