import { parseFrontmatter } from "./parseFrontmatter"
import { validatePost } from "./validatePost"
import { renderMarkdown } from "./renderMarkdown"
import { readingMinutes } from "./readingMinutes"
import type { BlogPost } from "./types"

export const DEFAULT_AUTHOR = "Fausto Chirino"

// Raw file → validated, rendered BlogPost. Throws (listing every problem)
// rather than returning a partial post: a broken frontmatter must fail the
// test suite and the build, never ship as an empty card.
export function buildPost(slug: string, raw: string): BlogPost {
  const { data, body } = parseFrontmatter(raw)

  const errors = validatePost({ slug, data, body })
  if (errors.length > 0) {
    throw new Error(`blog post ${JSON.stringify(slug)} is invalid:\n  - ${errors.join("\n  - ")}`)
  }

  // validatePost already guaranteed the types of the required fields.
  const author = typeof data.author === "string" && data.author.trim() !== "" ? data.author : DEFAULT_AUTHOR

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    author,
    draft: data.draft === true,
    tags: Array.isArray(data.tags) ? data.tags : [],
    body,
    html: renderMarkdown(body),
    readingMinutes: readingMinutes(body),
  }
}

// The slug is the filename: "./clientflow-ya-esta-disponible.md" →
// "clientflow-ya-esta-disponible". Accepts any path shape import.meta.glob
// may hand us (relative or absolute).
export function slugFromPath(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? filePath
  return fileName.replace(/\.md$/, "")
}

// Every post, drafts included, newest first. Ties are broken by slug so the
// order is stable whatever the filesystem's directory-listing order.
export function buildPosts(files: Record<string, string>): BlogPost[] {
  const seen = new Set<string>()
  const posts = Object.entries(files).map(([filePath, raw]) => {
    const slug = slugFromPath(filePath)
    if (seen.has(slug)) {
      throw new Error(`blog: duplicate slug ${JSON.stringify(slug)} (${filePath})`)
    }
    seen.add(slug)
    return buildPost(slug, raw)
  })

  // Plain code-point comparison (no localeCompare): ISO dates and kebab-case
  // slugs sort correctly that way, and it doesn't depend on the ICU build.
  return posts.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0
  })
}
