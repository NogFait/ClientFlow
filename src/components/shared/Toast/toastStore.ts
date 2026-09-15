export type ToastVariant = "success" | "error"

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

const AUTO_DISMISS_MS = 3000

// Plain module-level store (no React) so it's usable from useSyncExternalStore
// — React-Compiler-safe — and unit-testable on its own, without mounting a
// component or a Provider. ToastProvider is the only consumer of subscribe/
// getSnapshot; useToast only needs push().
let toasts: ToastItem[] = []
const listeners = new Set<() => void>()
let nextId = 0

function emit() {
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): ToastItem[] {
  return toasts
}

export function push(message: string, variant: ToastVariant): string {
  const id = `toast-${++nextId}`
  toasts = [...toasts, { id, message, variant }]
  emit()
  setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  return id
}

export function dismiss(id: string): void {
  const next = toasts.filter(t => t.id !== id)
  if (next.length === toasts.length) return
  toasts = next
  emit()
}

// Test-only: clears module state between test cases/files — this store is a
// singleton, so without this, toasts pushed in one test would leak into the
// next.
export function _reset(): void {
  toasts = []
  nextId = 0
}
