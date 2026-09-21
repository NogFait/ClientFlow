import { Check, Clock, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { IClient } from "../../types"
import type { IClientNote } from "../../notes/types"
import { useCurrentLang } from "../../../../i18n/useCurrentLang"
import { formatDateOnly } from "../../../../i18n/locale"
import styles from "./ClientCard.module.css"

// Icons per DB status value; the label comes from status.client.* at render.
const statusConfig: Record<string, { key: "activo" | "pendiente" | "inactivo"; icon: typeof Check }> = {
  activo: { key: "activo", icon: Check },
  pendiente: { key: "pendiente", icon: Clock },
  inactivo: { key: "inactivo", icon: X },
}

interface ClientCardProps {
  client: IClient
  /** Newest history entry, shown as "date · text" under the name (the R in CRM, visible without opening the detail). */
  latestNote?: IClientNote
  onView: (client: IClient) => void
  onEdit: (client: IClient) => void
  onDelete: (client: IClient) => void
}

const ClientCard = ({ client, latestNote, onView, onEdit, onDelete }: ClientCardProps) => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const config = statusConfig[client.status] ?? statusConfig.pendiente
  const Icon = config.icon
  const statusKey = client.status.charAt(0).toUpperCase() + client.status.slice(1)
  const badgeClass = `badge${statusKey}` as keyof typeof styles

  return (
    <tr className={styles.row}>
      <td className={styles.cellName}>
        <span className={styles.name}>{client.name}</span>
        {latestNote && (
          <span className={styles.lastNote} title={latestNote.content}>
            <time className={styles.lastNoteDate} dateTime={latestNote.note_date}>{formatDateOnly(latestNote.note_date, lang)}</time>
            <span className={styles.lastNoteText}>{latestNote.content}</span>
          </span>
        )}
      </td>
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
