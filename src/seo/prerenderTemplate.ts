import { SITE_URL } from "../content/site"

// The three head fields every prerendered page needs. Structurally satisfied
// by PublicPageMeta (static routes) and by PublicPage (getPublicPages(),
// which adds the blog) — `path` is a plain string here on purpose so blog
// slugs, unknown at compile time, fit.
export interface HeadMeta {
  path: string
  title: string
  description: string
}

// Pure string transforms applied by scripts/prerender.mjs to the built
// dist/index.html. Kept DOM-free (no jsdom/cheerio) on purpose: the template
// is our own, its tag shapes are known, and a regex over a few hundred
// bytes is easier to audit than a parser round-trip that could reserialize
// the whole document differently from what Vite emitted.

const ROOT_MARKER = '<div id="root"></div>'

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

// Replaces exactly one occurrence of `pattern`; throws if it isn't there so
// a template change (someone renames a meta tag in index.html) fails the
// build loudly instead of silently shipping the landing's metadata on every
// route.
function replaceRequired(template: string, pattern: RegExp, label: string, replacement: string): string {
  if (!pattern.test(template)) {
    throw new Error(`prerender: template is missing the ${label} tag`)
  }
  // Function form so "$&"/"$1" inside the replacement are literal.
  return template.replace(pattern, () => replacement)
}

export function injectApp(template: string, appHtml: string): string {
  if (!template.includes(ROOT_MARKER)) {
    throw new Error(`prerender: template has no empty #root container (${ROOT_MARKER}) to inject into`)
  }
  return template.replace(ROOT_MARKER, () => `<div id="root">${appHtml}</div>`)
}

export function applyHeadMeta(template: string, meta: HeadMeta): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const url = `${SITE_URL}${meta.path}`

  // Vite may reformat whitespace inside a tag but keeps attribute order, so
  // each pattern anchors on the identifying attribute and swallows the rest
  // of the tag (`[^>]*`) — attributes are rewritten wholesale.
  const steps: Array<[RegExp, string, string]> = [
    [/<title>[^<]*<\/title>/, "<title>", `<title>${title}</title>`],
    [/<meta\s+name="description"[^>]*\/>/, 'meta[name="description"]', `<meta name="description" content="${description}" />`],
    [/<link\s+rel="canonical"[^>]*\/>/, 'link[rel="canonical"]', `<link rel="canonical" href="${url}" />`],
    [/<meta\s+property="og:title"[^>]*\/>/, "og:title", `<meta property="og:title" content="${title}" />`],
    [
      /<meta\s+property="og:description"[^>]*\/>/,
      "og:description",
      `<meta property="og:description" content="${description}" />`,
    ],
    [/<meta\s+property="og:url"[^>]*\/>/, "og:url", `<meta property="og:url" content="${url}" />`],
    [/<meta\s+name="twitter:title"[^>]*\/>/, "twitter:title", `<meta name="twitter:title" content="${title}" />`],
    [
      /<meta\s+name="twitter:description"[^>]*\/>/,
      "twitter:description",
      `<meta name="twitter:description" content="${description}" />`,
    ],
  ]

  return steps.reduce(
    (html, [pattern, label, replacement]) => replaceRequired(html, pattern, label, replacement),
    template,
  )
}
