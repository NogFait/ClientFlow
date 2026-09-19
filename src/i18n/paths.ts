import { DEFAULT_LANG, SUPPORTED_LANGS, type Lang } from "./index"

// URL ↔ language mapping for the public site. Spanish is the unprefixed
// default (/, /pricing, …) and English lives under /en (/en, /en/pricing, …).
// Pure string functions — shared by the router, the language switch, the
// page-meta alternates and the build-time page list, so the four can never
// disagree on which URL is "the English version" of a page.

const EN_PREFIX = "/en"

// Spanish routes that have an English twin. The blog is Spanish-only (its
// posts aren't translated) and login/register/app routes carry no language
// in the URL at all — they follow the stored preference instead.
const LOCALIZED_ROUTES = new Set(["/", "/pricing", "/terms", "/privacy"])

function stripEnPrefix(path: string): string {
  if (path === EN_PREFIX || path === `${EN_PREFIX}/`) return "/"
  if (path.startsWith(`${EN_PREFIX}/`)) return path.slice(EN_PREFIX.length)
  return path
}

export function langFromPath(path: string): Lang {
  return path === EN_PREFIX || path.startsWith(`${EN_PREFIX}/`) ? "en" : DEFAULT_LANG
}

// Localized route counterpart. Paths without a counterpart (blog, auth, app)
// are returned untouched so callers can use it unconditionally on any path.
export function toLocalizedPath(path: string, lang: Lang): string {
  const base = stripEnPrefix(path)
  if (!LOCALIZED_ROUTES.has(base)) return base
  if (lang === "es") return base
  return base === "/" ? EN_PREFIX : `${EN_PREFIX}${base}`
}

export function hasLocalizedCounterpart(path: string): boolean {
  return LOCALIZED_ROUTES.has(stripEnPrefix(path))
}

// Language to boot the app in for a cold load of `path`. On localized public
// routes the URL is authoritative (it's what crawlers indexed and what the
// prerendered HTML was rendered in — hydration must match it); on the blog
// the chrome follows the Spanish-only content; anywhere else the stored
// preference decides.
export function resolveInitialLang(path: string, stored: Lang | null): Lang {
  if (hasLocalizedCounterpart(path)) return langFromPath(path)
  if (path === "/blog" || path.startsWith("/blog/")) return DEFAULT_LANG
  return stored ?? DEFAULT_LANG
}

// Every URL a localized public route is served at — what the router
// registers and what the prerender/sitemap enumerate.
export function publicPaths(path: string): string[] {
  return SUPPORTED_LANGS.map((lang) => toLocalizedPath(path, lang))
}
