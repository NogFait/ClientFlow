import i18next, { type i18n as I18nInstance } from "i18next"
import { DEFAULT_LANG, SUPPORTED_LANGS, type Lang } from "./index"
import { DEFAULT_NS, NAMESPACES, resources } from "./resources"

// Factory, not a singleton: the build-time prerender renders several pages
// in a row (/, /en, /pricing, /en/pricing, …) from one Node process, and a
// shared mutable instance would let page N's language bleed into page N+1.
// Each render — and the client, once — gets its own instance and hands it
// to the tree through <I18nextProvider>.
//
// `initAsync: false` + bundled resources make init() synchronous, so the
// returned instance is ready to translate on the very first render — a
// requirement for hydration (server and client must produce the same
// markup) and for react-dom/static's prerender, which has no loading state.
export function createI18n(lng: Lang): I18nInstance {
  const instance = i18next.createInstance()

  void instance.init({
    lng,
    fallbackLng: DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGS,
    resources,
    ns: NAMESPACES,
    defaultNS: DEFAULT_NS,
    initAsync: false,
    returnNull: false,
    // React escapes rendered strings itself; escaping here too would turn
    // "Términos & privacidad" into "&amp;" on screen.
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

  return instance
}
