import type { LucideIcon } from "lucide-react"
import styles from "./StatCard.module.css"

interface StatCardProps {
  label: string
  value: string | number
  primaryLabel?: string
  secondaryValue?: string | number
  secondaryLabel?: string
  icon?: LucideIcon
  variant?: "default" | "primary" | "success" | "warning" | "error"
}

const variantClassMap: Record<string, string> = {
  default: "iconDefault",
  primary: "iconPrimary",
  success: "iconSuccess",
  warning: "iconWarning",
  error: "iconError",
}

const valueVariantMap: Record<string, string> = {
  default: "",
  primary: "valuePrimary",
  success: "valueSuccess",
  warning: "valueWarning",
  error: "valueError",
}

const StatCard = ({ label, value, primaryLabel, secondaryValue, secondaryLabel, icon: Icon, variant = "default" }: StatCardProps) => {
  const iconVariant = variantClassMap[variant]
  const valueVariant = valueVariantMap[variant]

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        {Icon && (
          <div className={`${styles.iconWrapper} ${styles[iconVariant]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className={styles.label}>{label}</p>
      {secondaryValue !== undefined ? (
        <div className={styles.splitValues}>
          <div className={styles.valueRow}>
            <span className={`${styles.value} ${valueVariant ? styles[valueVariant] : ""}`}>{value}</span>
            {primaryLabel && <span className={styles.subLabel}>{primaryLabel}</span>}
          </div>
          <div className={styles.valueRow}>
            <span className={`${styles.value} ${valueVariant ? styles[valueVariant] : ""}`}>{secondaryValue}</span>
            {secondaryLabel && <span className={styles.subLabel}>{secondaryLabel}</span>}
          </div>
        </div>
      ) : (
        <p className={`${styles.value} ${valueVariant ? styles[valueVariant] : ""}`}>{value}</p>
      )}
    </article>
  )
}

export default StatCard
