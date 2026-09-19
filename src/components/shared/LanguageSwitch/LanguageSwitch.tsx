import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { SUPPORTED_LANGS, type Lang } from "../../../i18n"
import { hasLocalizedCounterpart, toLocalizedPath } from "../../../i18n/paths"
import { setStoredLang } from "../../../i18n/preference"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import styles from "./LanguageSwitch.module.css"

interface LanguageSwitchProps {
  /**
   * route — public pages: the URL carries the language, so switching means
   *   navigating to the counterpart path (/pricing ⇄ /en/pricing); the
   *   route wrapper then changes the i18n language. Also stores the
   *   preference so the choice follows the visitor into login/the app.
   * preference — pages without a language in the URL (login/register):
   *   stores the preference and changes the i18n language in place.
   */
  mode: "route" | "preference"
  className?: string
}

const LABEL: Record<Lang, string> = { es: "ES", en: "EN" }

// Segmented ES | EN control. Two real <button>s (keyboard/focus for free)
// inside a labelled group; the active one is aria-pressed, never disabled,
// so a screen reader announces the state instead of skipping it.
const LanguageSwitch = ({ mode, className }: LanguageSwitchProps) => {
  const { t, i18n } = useTranslation()
  const current = useCurrentLang()
  const location = useLocation()
  const navigate = useNavigate()

  // Nothing to switch to on the Spanish-only blog: a control that reloads
  // the same page is worse than no control ("Blog (es)" in the nav already
  // says why).
  if (mode === "route" && !hasLocalizedCounterpart(location.pathname)) return null

  const select = (lang: Lang) => {
    if (lang === current) return
    setStoredLang(lang)
    if (mode === "route") {
      navigate({ pathname: toLocalizedPath(location.pathname, lang), search: location.search, hash: location.hash })
    } else {
      void i18n.changeLanguage(lang)
    }
  }

  return (
    <div role="group" aria-label={t("language.label")} className={className ? `${styles.group} ${className}` : styles.group}>
      {SUPPORTED_LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-label={t(`language.${lang}`)}
          aria-pressed={lang === current}
          className={lang === current ? styles.optionActive : styles.option}
          onClick={() => select(lang)}
        >
          {LABEL[lang]}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitch
