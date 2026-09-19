import type { ReactElement } from "react"
import { render, type RenderResult } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { createI18n } from "../i18n/createI18n"
import type { Lang } from "../i18n"

interface RenderWithLangOptions {
  /** Initial history entries for the MemoryRouter (defaults to ["/"]). */
  initialEntries?: string[]
}

// Renders `ui` inside a fresh i18next instance for `lang` (+ a MemoryRouter,
// since every public page uses router links). A NEW instance per call keeps
// language state from leaking between tests in the same file — the global
// Spanish fallback registered in setup.ts is never touched.
export function renderWithLang(
  ui: ReactElement,
  lang: Lang,
  { initialEntries = ["/"] }: RenderWithLangOptions = {},
): RenderResult & { i18n: ReturnType<typeof createI18n> } {
  const i18n = createI18n(lang)
  const result = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </I18nextProvider>,
  )
  return { ...result, i18n }
}
