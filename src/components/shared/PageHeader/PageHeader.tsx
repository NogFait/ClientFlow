import type { ReactNode } from "react"
import { Plus } from "lucide-react"
import styles from "./PageHeader.module.css"

interface PageHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  // Optional extra content (e.g. a MonthSelector) rendered below the
  // title/action row — additive, so existing callers are unaffected.
  children?: ReactNode
  // Optional control rendered in the title row, right-aligned (e.g. the
  // weekly digest switch) — where the action button goes when there is none.
  aside?: ReactNode
}

const PageHeader = ({ title, description, actionLabel, onAction, children, aside }: PageHeaderProps) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {(aside || (actionLabel && onAction)) && (
          <div className={styles.aside}>
            {aside}
            {actionLabel && onAction && (
              <button className={styles.actionButton} onClick={onAction}>
                <Plus size={16} className={styles.actionIcon} />
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
      {children && <div className={styles.extra}>{children}</div>}
    </div>
  )
}

export default PageHeader
