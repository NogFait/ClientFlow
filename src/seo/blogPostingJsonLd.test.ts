import { describe, expect, it } from "vitest"
import { buildBlogPostingJsonLd } from "./blogPostingJsonLd"
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "../content/site"
import type { BlogPost } from "../content/blog/types"

const POST: BlogPost = {
  slug: "hola-mundo",
  title: "Hola mundo",
  description: "Primer post.",
  date: "2026-09-16",
  author: "Fausto Chirino",
  draft: false,
  tags: ["lanzamiento"],
  body: "## Hola",
  html: "<h2>Hola</h2>",
  readingMinutes: 1,
}

describe("buildBlogPostingJsonLd", () => {
  it("builds a schema.org BlogPosting from the post", () => {
    const jsonLd = buildBlogPostingJsonLd(POST)

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "Hola mundo",
      description: "Primer post.",
      datePublished: "2026-09-16",
      dateModified: "2026-09-16",
      inLanguage: "es",
      author: { "@type": "Person", name: "Fausto Chirino" },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
      },
      mainEntityOfPage: `${SITE_URL}/blog/hola-mundo`,
      image: DEFAULT_OG_IMAGE,
    })
  })

  it("uses the post author (triangulation: a guest author)", () => {
    expect(buildBlogPostingJsonLd({ ...POST, author: "Invitada" }).author.name).toBe("Invitada")
  })
})
