import { useLayoutEffect, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toLang, type Lang } from "../../i18n"

interface LocaleRouteProps {
  lang: Lang
  children: ReactNode
}

// Route-level element for the localized public pages: makes the i18n
// instance follow the URL's language. Every public route is registered
// twice (/pricing and /en/pricing) with a LocaleRoute of the matching lang.
//
// On a cold load nothing happens here — entry-client/entry-server already
// created the instance in the URL's language (that's what makes hydration
// of the prerendered HTML match). The effect only matters for client-side
// navigation across languages (the ES|EN switch, a link from /en to /).
// useLayoutEffect rather than useEffect so the swap lands before the
// browser paints — no one-frame flash of Spanish at /en.
const LocaleRoute = ({ lang, children }: LocaleRouteProps) => {
  const { i18n } = useTranslation()

  useLayoutEffect(() => {
    if (toLang(i18n.resolvedLanguage ?? i18n.language) !== lang) {
      void i18n.changeLanguage(lang)
    }
  }, [i18n, lang])

  return children
}

export default LocaleRoute
