import { useEffect } from "react"
import { useCurrentLang } from "../../i18n/useCurrentLang"

// Keeps <html lang> in step with the i18n instance on the client. The
// prerendered HTML already carries the right attribute (applyHeadMeta), so
// this only changes anything on client-side language switches and on the
// non-prerendered routes (login/register/app) served from the Spanish
// app.html shell. Renders nothing.
const HtmlLangSync = () => {
  const lang = useCurrentLang()

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return null
}

export default HtmlLangSync
