import { CheckCircle, Clock, Eye } from "lucide-react"
import type { IPayment } from "../../types"
import styles from "./PaymentTableRow.module.css"

interface PaymentTableRowProps {
  payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }
  onView: (payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }) => void
  onEdit: (payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }) => void
  onDelete: (payment: IPayment) => void
}

const PaymentTableRow = ({ payment, onView, onEdit, onDelete }: PaymentTableRowProps) => {
  const isPagado = payment.status === "pagado"

  return (
    <tr className={styles.row}>
      <td className={styles.cell}>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}</td>
      <td className={styles.cell}>{payment.proyectos?.clientes?.name ?? "—"}</td>
      <td className={styles.cell}>{payment.proyectos?.name ?? "—"}</td>
      <td className={styles.cellAmount}>
        ${Number(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className={styles.cell}>
        <span className={`${styles.badge} ${isPagado ? styles.badgePagado : styles.badgePendiente}`}>
          {isPagado ? <CheckCircle size={12} /> : <Clock size={12} />}
          {isPagado ? "Pagado" : "Pendiente"}
        </span>
      </td>
      <td className={styles.cell}>
        {payment.method === "efectivo" ? "Efectivo"
          : payment.method === "transferencia" ? "Transferencia"
          : payment.method === "tarjeta" ? "Tarjeta"
          : "Otro"}
      </td>
      <td className={styles.cellActions}>
        <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => onView(payment)}>
          <Eye size={14} /> Ver
        </button>
        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => onEdit(payment)}>Editar</button>
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(payment)}>Eliminar</button>
      </td>
    </tr>
  )
}

export default PaymentTableRow
