import { useRef } from "react"
import { useTranslation } from "react-i18next"
import Modal from "../Modal/Modal"
import styles from "./ConfirmDialog.module.css"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  // Explicit null hides the Cancel button entirely — used for informational
  // dialogs (e.g. "no podés eliminar esto") that only have an acknowledgement
  // action. Leaving it undefined keeps the default (translated "Cancelar").
  cancelLabel?: string | null
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Shared replacement for window.confirm — built on the same Modal used
// everywhere else so it inherits the responsive bottom-sheet layout,
// Escape/backdrop handling and focus restore for free. The confirm button
// gets initial focus (via Modal's initialFocusRef) since destructive
// confirmation is the expected next action, not an accidental Enter-key trap.
const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t } = useTranslation("app")
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  // Defaults resolve here, not in the parameter list, so they follow the
  // current language instead of being frozen at module load.
  const confirmText = confirmLabel ?? t("shared.delete")
  const cancelText = cancelLabel === undefined ? t("shared.cancel") : cancelLabel

  return (
    <Modal isOpen={open} onClose={onCancel} title={title} initialFocusRef={confirmButtonRef}>
      <div className={styles.content}>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          {cancelText !== null && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmButtonRef}
            type="button"
            className={danger ? styles.confirmButtonDanger : styles.confirmButton}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t("shared.deleting") : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
