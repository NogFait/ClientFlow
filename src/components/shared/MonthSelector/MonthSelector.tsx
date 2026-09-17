import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { currentMonthKey, formatMonthEsAr, shiftMonth, type MonthKey } from "../../../utils/month"
import styles from "./MonthSelector.module.css"

interface MonthSelectorProps {
  value: MonthKey
  onChange: (next: MonthKey) => void
  max?: MonthKey
}

const SHORT_MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

// Prev/next/"Hoy" navigation for a single calendar month, plus a quick
// picker (year stepper + 12-month grid) behind the label so jumping to
// "marzo del año pasado" is two clicks instead of eighteen. Purely
// controlled: the parent owns `value` (usually synced to a URL search
// param) and decides what a month change means (reload data, etc.).
const MonthSelector = ({ value, onChange, max }: MonthSelectorProps) => {
  const today = currentMonthKey()
  const isAtMax = max !== undefined && value >= max
  const isCurrent = value === today

  const [pickerOpen, setPickerOpen] = useState(false)
  // The year shown in the picker is local UI state: stepping it must not
  // change `value` until a month is actually chosen.
  const [pickerYear, setPickerYear] = useState(() => Number(value.slice(0, 4)))
  const rootRef = useRef<HTMLDivElement>(null)

  const goTo = (next: MonthKey) => {
    if (max !== undefined && next > max) return
    onChange(next)
  }

  const openPicker = () => {
    setPickerYear(Number(value.slice(0, 4)))
    setPickerOpen(true)
  }

  const pick = (monthIndex: number) => {
    const key = `${pickerYear}-${String(monthIndex + 1).padStart(2, "0")}` as MonthKey
    setPickerOpen(false)
    goTo(key)
  }

  // Close on outside click / Escape — the picker is a lightweight popover,
  // not a modal, so it must get out of the way without trapping focus.
  useEffect(() => {
    if (!pickerOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setPickerOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [pickerOpen])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (pickerOpen) return
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      goTo(shiftMonth(value, -1))
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      goTo(shiftMonth(value, 1))
    }
  }

  return (
    <div ref={rootRef} className={styles.root}>
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

        <button
          type="button"
          className={styles.label}
          aria-label={`Elegir mes (actual: ${formatMonthEsAr(value)})`}
          aria-expanded={pickerOpen}
          onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
        >
          <span aria-live="polite">{formatMonthEsAr(value)}</span>
        </button>

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

      {pickerOpen && (
        <div className={styles.picker} role="dialog" aria-label="Elegir mes">
          <div className={styles.pickerYear}>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Año anterior"
              onClick={() => setPickerYear(y => y - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.pickerYearLabel}>{pickerYear}</span>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Año siguiente"
              onClick={() => setPickerYear(y => y + 1)}
              disabled={max !== undefined && `${pickerYear + 1}-01` > max}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className={styles.pickerGrid}>
            {SHORT_MONTHS.map((name, i) => {
              const key = `${pickerYear}-${String(i + 1).padStart(2, "0")}` as MonthKey
              const disabled = max !== undefined && key > max
              const selected = key === value
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.pickerMonth} ${selected ? styles.pickerMonthSelected : ""}`}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => pick(i)}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MonthSelector
