import { useTranslation } from "react-i18next"
import styles from "./UsageMeter.module.css"

interface UsageMeterProps {
  label: string
  used: number
  limit: number | null
}

// null limit = unlimited (Pro plans) — shown as "used — ilimitado" with no
// progress bar, since there is nothing to measure progress against.
const UsageMeter = ({ label, used, limit }: UsageMeterProps) => {
  const { t } = useTranslation("app")
  const isUnlimited = limit === null
  const percent = isUnlimited ? 0 : limit === 0 ? 100 : Math.min(100, (used / limit) * 100)

  return (
    <div className={styles.meter}>
      <div className={styles.meterHeader}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{isUnlimited ? t("billing.meters.unlimited", { used }) : `${used} / ${limit}`}</span>
      </div>
      {!isUnlimited && (
        <div
          className={styles.track}
          role="progressbar"
          aria-label={label}
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  )
}

export default UsageMeter
