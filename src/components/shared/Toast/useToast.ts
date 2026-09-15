import { push } from "./toastStore"

interface UseToastResult {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

// Thin wrapper around the toastStore module — pages call these after a
// create/update/delete succeeds (or, for error(), alongside their existing
// inline error message, which stays as the primary error surface). info()
// is for non-blocking heads-up messages that aren't a success confirmation
// or a failure (e.g. "Quedan N tareas pendientes" after marking a project
// completo with pending tasks).
export function useToast(): UseToastResult {
  return {
    success: (message: string) => {
      push(message, "success")
    },
    error: (message: string) => {
      push(message, "error")
    },
    info: (message: string) => {
      push(message, "info")
    },
  }
}
