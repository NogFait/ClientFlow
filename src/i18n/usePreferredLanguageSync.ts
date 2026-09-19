import { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { toLang } from "./index"
import { useStoredLang } from "./preference"

// For routes whose URL carries no language (login/register): the stored
// preference wins whenever one exists. When none was ever chosen the
// current language is left alone, so a visitor who arrived via /en and
// clicked "Log in" isn't flipped back to Spanish on the way.
export function usePreferredLanguageSync(): void {
  const { i18n } = useTranslation()
  const stored = useStoredLang()

  useLayoutEffect(() => {
    if (stored !== null && toLang(i18n.resolvedLanguage ?? i18n.language) !== stored) {
      void i18n.changeLanguage(stored)
    }
  }, [i18n, stored])
}
