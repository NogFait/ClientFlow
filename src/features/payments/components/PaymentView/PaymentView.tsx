import type { IPayment } from "../../types"
import styles from "./PaymentView.module.css"

interface PaymentViewProps {
  payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }
}

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  other: "Otro",
}

const PaymentView = ({ payment }: PaymentViewProps) => (
  <div className={styles.detailGrid}>
    <div className={styles.field}>
      <span className={styles.label}>Proyecto</span>
      <span className={styles.value}>{payment.proyectos?.name ?? "—"}</span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>Cliente</span>
      <span className={styles.value}>{payment.proyectos?.clientes?.name ?? "—"}</span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>Monto</span>
      <span className={styles.value}>
        ${Number(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>Fecha de pago</span>
      <span className={styles.value}>
        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}
      </span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>Método</span>
      <span className={styles.value}>{methodLabels[payment.method] ?? payment.method}</span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>Estado</span>
      <span className={`${styles.statusBadge} ${payment.status === "pagado" ? styles.pagado : styles.pendiente}`}>
        {payment.status === "pagado" ? "Pagado" : "Pendiente"}
      </span>
    </div>
    <div className={`${styles.field} ${styles.fullWidth}`}>
      <span className={styles.label}>Notas</span>
      <span className={styles.value}>{payment.notes || "—"}</span>
    </div>
    {payment.created_at && (
      <div className={`${styles.field} ${styles.fullWidth}`}>
        <span className={styles.label}>Creado</span>
        <span className={styles.value}>{new Date(payment.created_at).toLocaleString()}</span>
      </div>
    )}
  </div>
)

export default PaymentView
