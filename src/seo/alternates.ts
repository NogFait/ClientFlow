import { SITE_URL } from "../content/site"
import { SUPPORTED_LANGS, type Lang } from "../i18n"
import { toLocalizedPath } from "../i18n/paths"

export interface HreflangAlternate {
  /** BCP-47 language, or "x-default" for the fallback crawlers use elsewhere. */
  hreflang: Lang | "x-default"
  /** Absolute URL. */
  href: string
}

// hreflang set for one localized public page: every language version plus
// x-default → Spanish (the site's original language and the unprefixed URL).
// Built from the SAME path helper the router and the switch use, so the
// alternates can't point at a URL that isn't actually routed. Emitted three
// ways — <link rel="alternate"> at runtime (usePageMeta), in the prerendered
// <head> (applyHeadMeta) and as <xhtml:link> in the sitemap.
export function buildAlternates(path: string): HreflangAlternate[] {
  const byLang = SUPPORTED_LANGS.map((lang) => ({
    hreflang: lang,
    href: `${SITE_URL}${toLocalizedPath(path, lang)}`,
  }))
  return [...byLang, { hreflang: "x-default", href: `${SITE_URL}${toLocalizedPath(path, "es")}` }]
}
