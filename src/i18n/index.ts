// Public surface of the i18n layer. Kept dependency-free (no i18next import)
// so pure modules — page meta, the prerender script's page list, the sitemap —
// can name languages without dragging the runtime in.
export const SUPPORTED_LANGS = ["es", "en"] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]
export const DEFAULT_LANG: Lang = "es"

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (SUPPORTED_LANGS as readonly string[]).includes(value)
}

// i18next reports `language` as a plain string (it can be "en-US" from a
// detector, or undefined before init). Every consumer that needs a Lang —
// page meta, alternates, the switch's pressed state — funnels through here
// so an unexpected value degrades to the default instead of to a broken URL.
export function toLang(value: string | undefined): Lang {
  if (value === undefined) return DEFAULT_LANG
  const base = value.split("-")[0]
  return isLang(base) ? base : DEFAULT_LANG
}
