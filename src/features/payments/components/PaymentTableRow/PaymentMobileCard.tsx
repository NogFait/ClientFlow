import { Link } from "react-router-dom"
import { CheckCircle, Clock, Eye, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../../../i18n/useCurrentLang"
import { formatDate } from "../../../../i18n/locale"
import type { IPayment } from "../../types"
import { formatCurrency } from "../../../../utils/currency"
import styles from "./PaymentMobileCard.module.css"

type PaymentWithRelations = IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }

interface PaymentMobileCardProps {
  payment: PaymentWithRelations
  onView: (payment: PaymentWithRelations) => void
  onEdit: (payment: PaymentWithRelations) => void
  onDelete: (payment: IPayment) => void
}

// Card representation of a payment row for narrow viewports (<768px) — the
// table's seven columns don't fit and its action buttons become
// unreachable without horizontal scrolling. Mirrors PaymentTableRow's data.
const PaymentMobileCard = ({ payment, onView, onEdit, onDelete }: PaymentMobileCardProps) => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const isPagado = payment.status === "pagado"
  const amount = formatCurrency(Number(payment.amount))
  const clientName = payment.proyectos?.clientes?.name ?? "—"
  const projectName = payment.proyectos?.name
  const projectLink = payment.project_id && projectName
    ? <Link to={`/projects/${payment.project_id}`}>{projectName}</Link>
    : "—"

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.amount}>{amount}</span>
        <span className={`${styles.badge} ${isPagado ? styles.badgePagado : styles.badgePendiente}`}>
          {isPagado ? <CheckCircle size={12} /> : <Clock size={12} />}
          {t(`status.payment.${payment.status}`)}
        </span>
      </div>
      <div className={styles.details}>
        <span className={styles.detailLine}>{clientName} — {projectLink}</span>
        <span className={styles.detailLine}>
          {payment.payment_date ? formatDate(payment.payment_date, lang) : "—"} · {t(`status.method.${payment.method}`)}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionView}`}
          onClick={() => onView(payment)}
          aria-label={t("payments.aria.view", { amount })}
        >
          <Eye size={16} /> {t("shared.view")}
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionEdit}`}
          onClick={() => onEdit(payment)}
          aria-label={t("payments.aria.edit", { amount })}
        >
          <Pencil size={16} /> {t("shared.edit")}
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionDelete}`}
          onClick={() => onDelete(payment)}
          aria-label={t("payments.aria.delete", { amount })}
        >
          <Trash2 size={16} /> {t("shared.delete")}
        </button>
      </div>
    </div>
  )
}

export default PaymentMobileCard
