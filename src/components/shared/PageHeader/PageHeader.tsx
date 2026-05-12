import { Plus } from "lucide-react"
import styles from "./PageHeader.module.css"

interface PageHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

const PageHeader = ({ title, description, actionLabel, onAction }: PageHeaderProps) => {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actionLabel && onAction && (
        <button className={styles.actionButton} onClick={onAction}>
          <Plus size={16} className={styles.actionIcon} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default PageHeader
