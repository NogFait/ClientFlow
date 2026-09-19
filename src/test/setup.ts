import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { _reset as resetToasts } from '../components/shared/Toast/toastStore'
import { setI18n } from 'react-i18next'
import { createI18n } from '../i18n/createI18n'

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

// Components read translations through react-i18next's useTranslation. The
// real app supplies an instance via <I18nextProvider> (entry-client /
// entry-server); tests render components bare, so register a Spanish
// instance as react-i18next's fallback — every existing test keeps asserting
// the same Spanish copy it always did. Tests that need English render
// through renderWithLang() (src/test/i18n.tsx) with an instance of their own.
setI18n(createI18n("es"))
