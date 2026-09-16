import { PUBLIC_PAGE_META, PUBLIC_PATHS } from "../content/pageMeta"
import { getAllPosts } from "../content/blog"
import { SITE_NAME, SITE_URL } from "../content/site"
import type { SitemapEntry } from "./sitemap"

export interface PublicPage {
  path: string
  title: string
  description: string
  /** YYYY-MM-DD. Omitted for static pages — the build fills in "today". */
  lastmod?: string
  /** Sitemap priority 0–1. */
  priority: number
}

export const BLOG_INDEX_META = {
  path: "/blog",
  title: `Blog — ${SITE_NAME}`,
  description: "Novedades de ClientFlow y notas sobre trabajar por tu cuenta: clientes, proyectos, cobros.",
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
// HTML and what it writes into dist/sitemap.xml. Static routes come from
// PUBLIC_PAGE_META (pages still read it at runtime); blog entries are derived
// from the published posts, so adding a .md file is all it takes for a new
// URL to be prerendered and advertised. Drafts never appear here.
export function getPublicPages(): PublicPage[] {
  const staticPages: PublicPage[] = PUBLIC_PATHS.map((path) => ({
    ...PUBLIC_PAGE_META[path],
    priority: STATIC_PRIORITY[path],
  }))

  const blogIndex: PublicPage = { ...BLOG_INDEX_META, priority: 0.7 }

  const postPages: PublicPage[] = getAllPosts().map((post) => ({
    path: blogPostPath(post.slug),
    title: blogPostTitle(post.title),
    description: post.description,
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
  }))
}
