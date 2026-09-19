import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import { currentMonthKey, formatMonth, shiftMonth, shortMonth, type MonthKey } from "../../../utils/month"
import styles from "./MonthSelector.module.css"

interface MonthSelectorProps {
  value: MonthKey
  onChange: (next: MonthKey) => void
  max?: MonthKey
  /** Months to flag in the picker (e.g. the ones with pending payments). */
  markedMonths?: MonthKey[]
}

// Prev/next/"Hoy" navigation for a single calendar month, plus a quick
// picker (year stepper + 12-month grid) behind the label so jumping to
// "marzo del año pasado" is two clicks instead of eighteen. Purely
// controlled: the parent owns `value` (usually synced to a URL search
// param) and decides what a month change means (reload data, etc.).
const MonthSelector = ({ value, onChange, max, markedMonths = [] }: MonthSelectorProps) => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const today = currentMonthKey()
  const currentLabel = formatMonth(value, lang)
  // Picker grid: three-letter names, capitalized in both languages ("Ene",
  // "Jan") — shortMonth() keeps Spanish lowercase for the running text in
  // the payments card, the grid wants title case.
  const shortMonths = Array.from({ length: 12 }, (_, i) => {
    const name = shortMonth(`2000-${String(i + 1).padStart(2, "0")}` as MonthKey, lang)
    return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
  })
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
        aria-label={t("shared.monthSelector.group")}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          className={styles.navButton}
          aria-label={t("shared.monthSelector.previous")}
          onClick={() => goTo(shiftMonth(value, -1))}
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          className={styles.label}
          aria-label={t("shared.monthSelector.pick", { month: currentLabel })}
          aria-expanded={pickerOpen}
          onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
        >
          <span aria-live="polite">{currentLabel}</span>
          <ChevronDown size={16} className={styles.labelChevron} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={styles.navButton}
          aria-label={t("shared.monthSelector.next")}
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
          {t("shared.monthSelector.today")}
        </button>
      </div>

      {pickerOpen && (
        <div className={styles.picker} role="dialog" aria-label={t("shared.monthSelector.pickerTitle")}>
          <div className={styles.pickerYear}>
            <button
              type="button"
              className={styles.navButton}
              aria-label={t("shared.monthSelector.previousYear")}
              onClick={() => setPickerYear(y => y - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.pickerYearLabel}>{pickerYear}</span>
            <button
              type="button"
              className={styles.navButton}
              aria-label={t("shared.monthSelector.nextYear")}
              onClick={() => setPickerYear(y => y + 1)}
              disabled={max !== undefined && `${pickerYear + 1}-01` > max}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {markedMonths.length > 0 && (
            <p className={styles.pickerHint}>
              <span className={styles.pickerDot} aria-hidden="true" /> {t("shared.monthSelector.pendingHint")}
            </p>
          )}
          <div className={styles.pickerGrid}>
            {shortMonths.map((name, i) => {
              const key = `${pickerYear}-${String(i + 1).padStart(2, "0")}` as MonthKey
              const disabled = max !== undefined && key > max
              const selected = key === value
              const marked = markedMonths.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.pickerMonth} ${selected ? styles.pickerMonthSelected : ""}`}
                  aria-pressed={selected}
                  aria-label={marked ? t("shared.monthSelector.monthWithPending", { month: name }) : name}
                  disabled={disabled}
                  onClick={() => pick(i)}
                >
                  {name}
                  {marked && <span className={styles.pickerDot} aria-hidden="true" />}
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
