import { useSyncExternalStore } from "react"
import { DEFAULT_LANG, isLang, type Lang } from "./index"

// Persisted language preference for the routes that carry no language in
// their URL (login/register today, the authenticated app next). The public
// pages are URL-driven, but they still WRITE here when the visitor toggles,
// so the choice made on the landing follows them into the app.
export const LANG_STORAGE_KEY = "clientflow.lang"

// Every storage access is guarded: Safari private mode, disabled site data
// and sandboxed previews all throw on localStorage, and a language toggle is
// never worth a crashed page. `typeof window` keeps the module importable in
// the SSR bundle, where none of this runs.
export function getStoredLang(): Lang | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.localStorage.getItem(LANG_STORAGE_KEY)
    return isLang(value) ? value : null
  } catch {
    return null
  }
}

const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

export function setStoredLang(lang: Lang): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    // Storage unavailable — the in-memory subscribers still get told, so the
    // UI reflects the choice for the rest of this page's life.
  }
  notify()
}

// The `storage` event only fires in OTHER tabs; same-tab writes go through
// setStoredLang → notify(). Subscribing to both keeps every open tab in sync.
function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === LANG_STORAGE_KEY) listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

const getServerSnapshot = (): null => null

// Raw preference: null means "never chosen". Consumers that must not override
// a URL-derived language when nothing was chosen (login reached from /en)
// need that distinction; useLang() below collapses it to the default.
export function useStoredLang(): Lang | null {
  return useSyncExternalStore(subscribe, getStoredLang, getServerSnapshot)
}

export function useLang(): Lang {
  return useStoredLang() ?? DEFAULT_LANG
}
