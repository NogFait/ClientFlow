import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { _reset as resetToasts } from '../components/shared/Toast/toastStore'

// @testing-library/react only auto-registers its afterEach(cleanup) when it
// detects a global `afterEach` (i.e. `test.globals: true` in vitest config).
// This project imports test globals explicitly instead, so cleanup must be
// wired up manually here — otherwise DOM from one test leaks into the next
// within the same file (multiple renders accumulate in document.body).
afterEach(() => {
  cleanup()
  // The toast store is module-level state: a "Cliente guardado" toast pushed
  // by one test would otherwise still be rendered in the next test's tree
  // (surfaced in CI as "Found multiple elements with the text ...").
  resetToasts()
})

// jsdom does not implement window.matchMedia — provide a default stub so any
// component using useMediaQuery (e.g. the responsive Sidebar/Navbar) doesn't
// throw in tests that don't care about viewport width. Defaults to "no
// match" (desktop). Individual tests can still override window.matchMedia
// themselves to exercise the mobile path.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
