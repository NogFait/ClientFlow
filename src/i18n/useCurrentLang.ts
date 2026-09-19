import { useTranslation } from "react-i18next"
import { toLang, type Lang } from "./index"

// The language the tree is currently rendering in, narrowed to Lang.
// Re-renders on changeLanguage (useTranslation subscribes to it), so page
// meta, localized links and the switch's pressed state all follow along.
export function useCurrentLang(): Lang {
  const { i18n } = useTranslation()
  return toLang(i18n.resolvedLanguage ?? i18n.language)
}
