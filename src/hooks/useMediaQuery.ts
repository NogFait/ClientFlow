import { useSyncExternalStore } from "react"

// useSyncExternalStore (not a setState-in-effect pattern) so this stays
// clean under react-hooks/set-state-in-effect (React Compiler lint) — the
// external store IS window.matchMedia, subscribed to its native change event.
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener("change", callback)
    return () => mql.removeEventListener("change", callback)
  }

  const getSnapshot = () => window.matchMedia(query).matches

  // SSR/no-window snapshot — this app has no server render today, but keeps
  // the hook safe if that ever changes.
  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
