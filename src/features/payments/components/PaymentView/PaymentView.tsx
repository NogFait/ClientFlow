import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../../../i18n/useCurrentLang"
import { formatDateOnly, formatDateTime } from "../../../../i18n/locale"
import type { IPayment } from "../../types"
import { formatCurrency } from "../../../../utils/currency"
import styles from "./PaymentView.module.css"

interface PaymentViewProps {
  payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }
}

const PaymentView = ({ payment }: PaymentViewProps) => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()

  return (
  <div className={styles.detailGrid}>
    <div className={styles.field}>
      <span className={styles.label}>{t("payments.fields.project")}</span>
      <span className={styles.value}>{payment.proyectos?.name ?? "—"}</span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>{t("payments.fields.client")}</span>
      <span className={styles.value}>{payment.proyectos?.clientes?.name ?? "—"}</span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>{t("payments.fields.amount")}</span>
      <span className={styles.value}>
        {formatCurrency(Number(payment.amount))}
      </span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>{t("payments.fields.paymentDate")}</span>
      <span className={styles.value}>
        {payment.payment_date ? formatDateOnly(payment.payment_date, lang) : "—"}
      </span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>{t("payments.fields.method")}</span>
      <span className={styles.value}>{t(`status.method.${payment.method}`)}</span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>{t("payments.fields.status")}</span>
      <span className={`${styles.statusBadge} ${payment.status === "pagado" ? styles.pagado : styles.pendiente}`}>
        {t(`status.payment.${payment.status}`)}
      </span>
    </div>
    <div className={`${styles.field} ${styles.fullWidth}`}>
      <span className={styles.label}>{t("payments.fields.notes")}</span>
      <span className={styles.value}>{payment.notes || "—"}</span>
    </div>
    {payment.created_at && (
      <div className={`${styles.field} ${styles.fullWidth}`}>
        <span className={styles.label}>{t("payments.fields.created")}</span>
        <span className={styles.value}>{formatDateTime(payment.created_at, lang)}</span>
      </div>
    )}
  </div>
  )
}

export default PaymentView
