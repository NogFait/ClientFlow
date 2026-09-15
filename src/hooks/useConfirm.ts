import { useCallback, useRef, useState } from "react"

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  // Explicit null hides the Cancel button (informational, acknowledge-only
  // dialogs). Undefined keeps ConfirmDialog's default "Cancelar" label.
  cancelLabel?: string | null
  danger?: boolean
}

interface PendingConfirm {
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string | null
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

interface UseConfirmResult {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  dialogProps: ConfirmDialogProps
}

// Promise-based replacement for window.confirm, backed by the shared
// ConfirmDialog component. Only one confirmation can be pending at a time —
// a second confirm() call while one is already open resolves false right
// away instead of queueing or clobbering the visible dialog. pendingRef
// (not just state) guards that check so it's correct even across the async
// gap before React re-renders with the new state.
export function useConfirm(): UseConfirmResult {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    if (pendingRef.current) {
      return Promise.resolve(false)
    }
    return new Promise<boolean>((resolve) => {
      const next: PendingConfirm = { options, resolve }
      pendingRef.current = next
      setPending(next)
    })
  }, [])

  const settle = useCallback((value: boolean) => {
    const current = pendingRef.current
    if (!current) return
    pendingRef.current = null
    setPending(null)
    current.resolve(value)
  }, [])

  const onConfirm = useCallback(() => settle(true), [settle])
  const onCancel = useCallback(() => settle(false), [settle])

  return {
    confirm,
    dialogProps: {
      open: pending !== null,
      title: pending?.options.title ?? "",
      description: pending?.options.description,
      confirmLabel: pending?.options.confirmLabel,
      cancelLabel: pending?.options.cancelLabel,
      danger: pending?.options.danger,
      onConfirm,
      onCancel,
    },
  }
}
