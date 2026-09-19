import { useSyncExternalStore, type ReactNode } from "react"
import { Info, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { dismiss, getSnapshot, subscribe } from "./toastStore"
import styles from "./Toast.module.css"

interface ToastProviderProps {
  children: ReactNode
}

const variantClass: Record<string, string> = {
  success: "toastSuccess",
  error: "toastError",
  info: "toastInfo",
}

// Mounted once in Layout so every page can call useToast(). Reads the
// toastStore module via useSyncExternalStore — React-Compiler-safe, and the
// store itself is plain data testable without mounting this component.
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const { t } = useTranslation("app")
  const toasts = useSyncExternalStore(subscribe, getSnapshot)

  return (
    <>
      {children}
      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${styles[variantClass[toast.variant]]}`}>
            {toast.variant === "info" && (
              <Info size={16} aria-hidden="true" className={styles.icon} data-testid="toast-icon-info" />
            )}
            <span className={styles.message}>{toast.message}</span>
            <button
              type="button"
              className={styles.dismissButton}
              onClick={() => dismiss(toast.id)}
              aria-label={t("shared.closeNotification")}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

export default ToastProvider
