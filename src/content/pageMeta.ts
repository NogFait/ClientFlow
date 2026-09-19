import { DEFAULT_LANG, SUPPORTED_LANGS, type Lang } from "../i18n"
import { toLocalizedPath } from "../i18n/paths"
import { resources } from "../i18n/resources"
import { buildAlternates, type HreflangAlternate } from "../seo/alternates"

// Single source of truth for the <head> of every public, indexable route,
// in both languages. Consumed twice — by usePageMeta at runtime (client-side
// navigation) and by scripts/prerender.mjs at build time (the static HTML
// crawlers receive) — so the two can never drift apart. Pure module: no DOM,
// no React, no i18next runtime (it reads the bundled JSON directly), safe to
// import from Node.
//
// Keys are the Spanish (canonical) paths; getPageMeta(path, lang) returns
// the entry for the localized twin (/pricing → /en/pricing for "en").
export type PublicPath = "/" | "/pricing" | "/terms" | "/privacy"

export interface PublicPageMeta {
  /** The localized route path this entry describes (e.g. "/en/pricing"). */
  path: string
  title: string
  description: string
  lang: Lang
  /** hreflang set shared by both language versions of the page. */
  alternates: HreflangAlternate[]
}

const META_KEY: Record<PublicPath, keyof (typeof resources)["es"]["common"]["meta"]> = {
  "/": "home",
  "/pricing": "pricing",
  "/terms": "terms",
  "/privacy": "privacy",
}

// Ordered list of the STATIC canonical routes. The full prerender/sitemap
// list (these ×2 languages + /blog + every published post) is
// getPublicPages() in src/seo/publicPages.ts.
export const PUBLIC_PATHS = Object.keys(META_KEY) as PublicPath[]

function buildPageMeta(path: PublicPath, lang: Lang): PublicPageMeta {
  // The legal descriptions are written by hand (summarising the document)
  // rather than lifted from the first paragraph — see common.json "meta".
  const { title, description } = resources[lang].common.meta[META_KEY[path]]
  return {
    path: toLocalizedPath(path, lang),
    title,
    description,
    lang,
    alternates: buildAlternates(path),
  }
}

function buildRecord(lang: Lang): Record<PublicPath, PublicPageMeta> {
  return Object.fromEntries(PUBLIC_PATHS.map((path) => [path, buildPageMeta(path, lang)])) as Record<
    PublicPath,
    PublicPageMeta
  >
}

// Every language's record, keyed by language then canonical path.
export const PUBLIC_PAGE_META_BY_LANG: Record<Lang, Record<PublicPath, PublicPageMeta>> = Object.fromEntries(
  SUPPORTED_LANGS.map((lang) => [lang, buildRecord(lang)]),
) as Record<Lang, Record<PublicPath, PublicPageMeta>>

// Spanish record, keyed by canonical path — the default-language view for
// callers that don't care about "en".
export const PUBLIC_PAGE_META: Record<PublicPath, PublicPageMeta> = PUBLIC_PAGE_META_BY_LANG[DEFAULT_LANG]

// Returns the prebuilt entry — a STABLE reference, so pages can pass it
// straight into usePageMeta's effect dependencies without re-running the
// head rewrite on every render.
export function getPageMeta(path: PublicPath, lang: Lang): PublicPageMeta {
  return PUBLIC_PAGE_META_BY_LANG[lang][path]
}
