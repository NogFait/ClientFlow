import { useCallback, useState } from "react"

const STORAGE_KEY = "clientflow.sidebar.collapsed"

// localStorage can throw (private browsing, disabled storage, quota) —
// degrade to the in-memory default rather than crashing the sidebar.
function readPersistedCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

function persistCollapsed(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Best-effort persistence only — state still works for this session.
  }
}

export interface UseSidebarStateResult {
  collapsed: boolean
  toggle: () => void
}

// Desktop-only collapse (icon rail) state, persisted across sessions.
export function useSidebarState(): UseSidebarStateResult {
  const [collapsed, setCollapsed] = useState<boolean>(() => readPersistedCollapsed())

  const toggle = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous
      persistCollapsed(next)
      return next
    })
  }, [])

  return { collapsed, toggle }
}
