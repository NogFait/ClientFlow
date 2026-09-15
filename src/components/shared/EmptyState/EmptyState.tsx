import type { LucideIcon } from "lucide-react"
import styles from "./EmptyState.module.css"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

// Shared empty state for list/board pages: icon + explanation + an optional
// CTA that reuses whatever action the page's own PageHeader button triggers
// (e.g. the same create-modal handler), so there's a single source of truth
// for "what happens when you click this".
const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Icon size={24} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionLabel && onAction && (
        <button type="button" className={styles.actionButton} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
