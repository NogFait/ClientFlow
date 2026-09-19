import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import styles from "./Modal.module.css"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  // Element to focus when the dialog opens instead of the dialog surface
  // itself — e.g. ConfirmDialog focuses its confirm button.
  initialFocusRef?: RefObject<HTMLElement | null>
}

const Modal = ({ isOpen, onClose, title, children, initialFocusRef }: ModalProps) => {
  const { t } = useTranslation("app")
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Keep the latest onClose reachable from the effect below without making
  // it a dependency — pages pass a fresh arrow function on every render, and
  // re-running the open/focus/scroll-lock setup on every render (rather than
  // just on the isOpen transition) would fight the user's own focus moves
  // inside the dialog. Updated in its own effect (runs after render) rather
  // than during render, so the React Compiler's ref-mutation lint is happy.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = "hidden"
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const target = initialFocusRef?.current ?? dialogRef.current
    target?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current()
      }
    }
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [isOpen, initialFocusRef])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t("shared.close")}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
