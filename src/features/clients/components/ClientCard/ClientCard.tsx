import { Check, Clock, X } from "lucide-react"
import type { IClient } from "../../types"
import styles from "./ClientCard.module.css"

const statusConfig: Record<string, { label: string; icon: typeof Check }> = {
  activo: { label: "Activo", icon: Check },
  pendiente: { label: "Pendiente", icon: Clock },
  inactivo: { label: "Inactivo", icon: X },
}

interface ClientCardProps {
  client: IClient
  onView: (client: IClient) => void
  onEdit: (client: IClient) => void
  onDelete: (client: IClient) => void
}

const ClientCard = ({ client, onView, onEdit, onDelete }: ClientCardProps) => {
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
          {config.label}
        </span>
      </td>
      <td className={styles.cellActions}>
        <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => onView(client)}>
          Ver
        </button>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => onEdit(client)}>
          Editar
        </button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(client)}>
          Eliminar
        </button>
      </td>
    </tr>
  )
}

export default ClientCard
