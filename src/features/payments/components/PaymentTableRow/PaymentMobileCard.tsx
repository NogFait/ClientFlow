import { CheckCircle, Clock, Eye, Pencil, Trash2 } from "lucide-react"
import type { IPayment } from "../../types"
import styles from "./PaymentMobileCard.module.css"

type PaymentWithRelations = IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }

interface PaymentMobileCardProps {
  payment: PaymentWithRelations
  onView: (payment: PaymentWithRelations) => void
  onEdit: (payment: PaymentWithRelations) => void
  onDelete: (payment: IPayment) => void
}

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  other: "Otro",
}

// Card representation of a payment row for narrow viewports (<768px) — the
// table's seven columns don't fit and its action buttons become
// unreachable without horizontal scrolling. Mirrors PaymentTableRow's data.
const PaymentMobileCard = ({ payment, onView, onEdit, onDelete }: PaymentMobileCardProps) => {
  const isPagado = payment.status === "pagado"
  const amount = Number(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const clientName = payment.proyectos?.clientes?.name ?? "—"
  const projectName = payment.proyectos?.name ?? "—"

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.amount}>${amount}</span>
        <span className={`${styles.badge} ${isPagado ? styles.badgePagado : styles.badgePendiente}`}>
          {isPagado ? <CheckCircle size={12} /> : <Clock size={12} />}
          {isPagado ? "Pagado" : "Pendiente"}
        </span>
      </div>
      <div className={styles.details}>
        <span className={styles.detailLine}>{clientName} — {projectName}</span>
        <span className={styles.detailLine}>
          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"} · {methodLabels[payment.method] ?? payment.method}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionView}`}
          onClick={() => onView(payment)}
          aria-label={`Ver pago de $${amount}`}
        >
          <Eye size={16} /> Ver
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionEdit}`}
          onClick={() => onEdit(payment)}
          aria-label={`Editar pago de $${amount}`}
        >
          <Pencil size={16} /> Editar
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionDelete}`}
          onClick={() => onDelete(payment)}
          aria-label={`Eliminar pago de $${amount}`}
        >
          <Trash2 size={16} /> Eliminar
        </button>
      </div>
    </div>
  )
}

export default PaymentMobileCard
