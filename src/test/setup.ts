import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// @testing-library/react only auto-registers its afterEach(cleanup) when it
// detects a global `afterEach` (i.e. `test.globals: true` in vitest config).
// This project imports test globals explicitly instead, so cleanup must be
// wired up manually here — otherwise DOM from one test leaks into the next
// within the same file (multiple renders accumulate in document.body).
afterEach(() => {
  cleanup()
})
