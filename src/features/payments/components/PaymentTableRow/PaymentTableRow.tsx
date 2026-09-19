import { Link } from "react-router-dom"
import { CheckCircle, Clock, Eye } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../../../i18n/useCurrentLang"
import { formatDate } from "../../../../i18n/locale"
import type { IPayment } from "../../types"
import { formatCurrency } from "../../../../utils/currency"
import styles from "./PaymentTableRow.module.css"

interface PaymentTableRowProps {
  payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }
  onView: (payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }) => void
  onEdit: (payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }) => void
  onDelete: (payment: IPayment) => void
}

const PaymentTableRow = ({ payment, onView, onEdit, onDelete }: PaymentTableRowProps) => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const isPagado = payment.status === "pagado"

  return (
    <tr className={styles.row}>
      <td className={styles.cell}>{payment.payment_date ? formatDate(payment.payment_date, lang) : "—"}</td>
      <td className={styles.cell}>{payment.proyectos?.clientes?.name ?? "—"}</td>
      <td className={styles.cell}>
        {payment.project_id && payment.proyectos?.name
          ? <Link to={`/projects/${payment.project_id}`}>{payment.proyectos.name}</Link>
          : "—"}
      </td>
      <td className={styles.cellAmount}>
        {formatCurrency(Number(payment.amount))}
      </td>
      <td className={styles.cell}>
        <span className={`${styles.badge} ${isPagado ? styles.badgePagado : styles.badgePendiente}`}>
          {isPagado ? <CheckCircle size={12} /> : <Clock size={12} />}
          {t(`status.payment.${payment.status}`)}
        </span>
      </td>
      <td className={styles.cell}>
        {t(`status.method.${payment.method}`)}
      </td>
      <td className={styles.cellActions}>
        <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => onView(payment)}>
          <Eye size={14} /> {t("shared.view")}
        </button>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => onEdit(payment)}>{t("shared.edit")}</button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(payment)}>{t("shared.delete")}</button>
      </td>
    </tr>
  )
}

export default PaymentTableRow
