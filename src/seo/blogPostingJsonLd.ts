import type { BlogPost } from "../content/blog/types"
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "../content/site"

export interface BlogPostingJsonLd {
  "@context": "https://schema.org"
  "@type": "BlogPosting"
  headline: string
  description: string
  datePublished: string
  dateModified: string
  inLanguage: "es"
  author: { "@type": "Person"; name: string }
  publisher: {
    "@type": "Organization"
    name: string
    logo: { "@type": "ImageObject"; url: string }
  }
  mainEntityOfPage: string
  image: string
}

// Pure builder — schema.org BlogPosting from the same post object the page
// renders, so headline/date can never drift from the visible article. The
// publisher logo matches the static Organization JSON-LD in index.html.
export function buildBlogPostingJsonLd(post: BlogPost): BlogPostingJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    // Posts have no edit history yet; Google wants dateModified present and
    // equal to datePublished is the honest value.
    dateModified: post.date,
    inLanguage: "es",
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    image: DEFAULT_OG_IMAGE,
  }
}
