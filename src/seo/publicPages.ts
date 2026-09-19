import { PUBLIC_PAGE_META_BY_LANG, PUBLIC_PATHS } from "../content/pageMeta"
import { getAllPosts } from "../content/blog"
import { SITE_NAME, SITE_URL } from "../content/site"
import { SUPPORTED_LANGS, type Lang } from "../i18n"
import type { HreflangAlternate } from "./alternates"
import type { SitemapEntry } from "./sitemap"

export interface PublicPage {
  path: string
  title: string
  description: string
  /** Language the page is rendered in — drives <html lang>, og:locale and the prerender's i18n instance. */
  lang: Lang
  /** hreflang set; absent for pages that exist in one language only (the blog). */
  alternates?: HreflangAlternate[]
  /** YYYY-MM-DD. Omitted for static pages — the build fills in "today". */
  lastmod?: string
  /** Sitemap priority 0–1. */
  priority: number
}

// The blog is Spanish-only: no alternates, always `lang: "es"`.
export const BLOG_INDEX_META = {
  path: "/blog",
  title: `Blog — ${SITE_NAME}`,
  description: "Novedades de ClientFlow y notas sobre trabajar por tu cuenta: clientes, proyectos, cobros.",
  lang: "es",
} as const

export function blogPostPath(slug: string): string {
  return `/blog/${slug}`
}

export function blogPostTitle(postTitle: string): string {
  return `${postTitle} — ${SITE_NAME}`
}

const STATIC_PRIORITY: Record<(typeof PUBLIC_PATHS)[number], number> = {
  "/": 1,
  "/pricing": 0.8,
  "/terms": 0.3,
  "/privacy": 0.3,
}

// THE list of indexable pages: what scripts/prerender.mjs renders to static
// HTML and what it writes into dist/sitemap.xml. Static routes come from the
// page meta (pages still read it at runtime), once per language — Spanish
// at the canonical paths, English under /en, same priority either side;
// blog entries are derived from the published posts, so adding a .md file
// is all it takes for a new URL to be prerendered and advertised. Drafts
// never appear here.
export function getPublicPages(): PublicPage[] {
  const staticPages: PublicPage[] = SUPPORTED_LANGS.flatMap((lang) =>
    PUBLIC_PATHS.map((path) => ({
      ...PUBLIC_PAGE_META_BY_LANG[lang][path],
      priority: STATIC_PRIORITY[path],
    })),
  )

  const blogIndex: PublicPage = { ...BLOG_INDEX_META, priority: 0.7 }

  const postPages: PublicPage[] = getAllPosts().map((post) => ({
    path: blogPostPath(post.slug),
    title: blogPostTitle(post.title),
    description: post.description,
    lang: "es",
    lastmod: post.date,
    priority: 0.6,
  }))

  return [...staticPages, blogIndex, ...postPages]
}

// Pages → sitemap rows. `today` is injected (not read from the clock) so the
// output is reproducible in tests and the script decides the date once.
export function toSitemapEntries(pages: PublicPage[], today: string): SitemapEntry[] {
  return pages.map((page) => ({
    loc: `${SITE_URL}${page.path}`,
    lastmod: page.lastmod ?? today,
    priority: page.priority,
    ...(page.alternates ? { alternates: page.alternates } : {}),
  }))
}
