import type { KeyboardEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { currentMonthKey, formatMonthEsAr, shiftMonth, type MonthKey } from "../../../utils/month"
import styles from "./MonthSelector.module.css"

interface MonthSelectorProps {
  value: MonthKey
  onChange: (next: MonthKey) => void
  max?: MonthKey
}

// Prev/next/"Hoy" navigation for a single calendar month, used by Payments
// (and anywhere else that needs a month-scoped view). Purely controlled:
// the parent owns `value` (usually synced to a URL search param) and
// decides what a month change means (reload data, update the URL, etc.).
const MonthSelector = ({ value, onChange, max }: MonthSelectorProps) => {
  const today = currentMonthKey()
  const isAtMax = max !== undefined && value >= max
  const isCurrent = value === today

  const goTo = (next: MonthKey) => {
    if (max !== undefined && next > max) return
    onChange(next)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      goTo(shiftMonth(value, -1))
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      goTo(shiftMonth(value, 1))
    }
  }

  return (
    <div
      className={styles.group}
      role="group"
      aria-label="Selector de mes"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={styles.navButton}
        aria-label="Mes anterior"
        onClick={() => goTo(shiftMonth(value, -1))}
      >
        <ChevronLeft size={18} />
      </button>

      <span className={styles.label} aria-live="polite">
        {formatMonthEsAr(value)}
      </span>

      <button
        type="button"
        className={styles.navButton}
        aria-label="Mes siguiente"
        onClick={() => goTo(shiftMonth(value, 1))}
        disabled={isAtMax}
      >
        <ChevronRight size={18} />
      </button>

      <button
        type="button"
        className={styles.todayButton}
        onClick={() => onChange(today)}
        disabled={isCurrent}
      >
        Hoy
      </button>
    </div>
  )
}

export default MonthSelector
