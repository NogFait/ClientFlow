import { push } from "./toastStore"

interface UseToastResult {
  success: (message: string) => void
  error: (message: string) => void
}

// Thin wrapper around the toastStore module — pages call these after a
// create/update/delete succeeds (or, for error(), alongside their existing
// inline error message, which stays as the primary error surface).
export function useToast(): UseToastResult {
  return {
    success: (message: string) => {
      push(message, "success")
    },
    error: (message: string) => {
      push(message, "error")
    },
  }
}
