import { useEffect } from "react"
import { SITE_URL, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from "../content/site"
import type { Lang } from "../i18n"
import type { HreflangAlternate } from "../seo/alternates"
import { OG_LOCALE } from "../seo/prerenderTemplate"

export interface PageMetaOptions {
  title: string
  description?: string
  /** Page language → og:locale. Omit to leave the static baseline (es_AR).
   *  <html lang> is NOT set here: HtmlLangSync follows the i18n instance so
   *  it's right on every route, not only the ones that call this hook. */
  lang?: Lang
  /** hreflang set for localized public pages; one <link rel="alternate"> each. */
  alternates?: HreflangAlternate[]
  /** Route path (e.g. "/pricing") used to build the canonical URL and og:url.
   *  Omit it to leave whatever index.html already set untouched — useful for
   *  routes (login/register) whose canonical doesn't matter because they're noindex. */
  path?: string
  /** Adds <meta name="robots" content="noindex,nofollow"> for the lifetime of
   *  the mount. Omitted/false leaves the page indexable (the default). */
  noindex?: boolean
  ogImage?: string
}

type Restore = () => void

// Overwrites one attribute of one <head> tag for the lifetime of the caller,
// returning a restore function: if the tag already existed (e.g. the static
// baseline in index.html), its previous value comes back on cleanup; if the
// hook had to create the tag, cleanup removes it entirely so navigating away
// doesn't leave stray tags from a page that no longer exists.
function manageAttr(
  selector: string,
  tagName: "meta" | "link",
  staticAttrs: Record<string, string>,
  valueAttr: string,
  value: string,
): Restore {
  const existing = document.head.querySelector<HTMLElement>(selector)

  if (existing) {
    const previousValue = existing.getAttribute(valueAttr)
    existing.setAttribute(valueAttr, value)
    return () => {
      if (previousValue === null) {
        existing.removeAttribute(valueAttr)
      } else {
        existing.setAttribute(valueAttr, previousValue)
      }
    }
  }

  const created = document.createElement(tagName)
  Object.entries(staticAttrs).forEach(([key, attrValue]) => created.setAttribute(key, attrValue))
  created.setAttribute(valueAttr, value)
  document.head.appendChild(created)
  return () => created.remove()
}

// Head management for route components: document.title, meta description,
// canonical link, Open Graph + Twitter card tags, and an opt-in noindex
// directive — all restored to whatever index.html shipped statically when
// the page unmounts, so navigating between routes never leaks one page's
// metadata into the next.
export function usePageMeta({ title, description, path, noindex, ogImage, lang, alternates }: PageMetaOptions): void {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    const resolvedDescription = description ?? DEFAULT_DESCRIPTION
    const resolvedOgImage = ogImage ?? DEFAULT_OG_IMAGE

    const restores: Restore[] = [
      manageAttr('meta[name="description"]', "meta", { name: "description" }, "content", resolvedDescription),
      manageAttr('meta[property="og:title"]', "meta", { property: "og:title" }, "content", title),
      manageAttr(
        'meta[property="og:description"]',
        "meta",
        { property: "og:description" },
        "content",
        resolvedDescription,
      ),
      manageAttr('meta[property="og:image"]', "meta", { property: "og:image" }, "content", resolvedOgImage),
      manageAttr('meta[name="twitter:title"]', "meta", { name: "twitter:title" }, "content", title),
      manageAttr(
        'meta[name="twitter:description"]',
        "meta",
        { name: "twitter:description" },
        "content",
        resolvedDescription,
      ),
      manageAttr('meta[name="twitter:image"]', "meta", { name: "twitter:image" }, "content", resolvedOgImage),
    ]

    if (path !== undefined) {
      const canonicalUrl = `${SITE_URL}${path}`
      restores.push(manageAttr('link[rel="canonical"]', "link", { rel: "canonical" }, "href", canonicalUrl))
      restores.push(manageAttr('meta[property="og:url"]', "meta", { property: "og:url" }, "content", canonicalUrl))
    }

    if (noindex) {
      restores.push(manageAttr('meta[name="robots"]', "meta", { name: "robots" }, "content", "noindex,nofollow"))
    }

    if (lang !== undefined) {
      restores.push(
        manageAttr('meta[property="og:locale"]', "meta", { property: "og:locale" }, "content", OG_LOCALE[lang]),
      )
    }

    // On a hydrated prerendered page the alternates already exist in <head>
    // (applyHeadMeta put them there) and get overwritten in place; on a
    // client-side navigation they're created and removed with the page.
    alternates?.forEach(({ hreflang, href }) => {
      restores.push(
        manageAttr(
          `link[rel="alternate"][hreflang="${hreflang}"]`,
          "link",
          { rel: "alternate", hreflang },
          "href",
          href,
        ),
      )
    })

    return () => {
      document.title = previousTitle
      restores.forEach((restore) => restore())
    }
  }, [title, description, path, noindex, ogImage, lang, alternates])
}
