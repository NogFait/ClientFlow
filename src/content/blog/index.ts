import { buildPosts } from "./loadPosts"
import type { BlogPost } from "./types"

export type { BlogPost } from "./types"

// Every *.md next to this file is a post; the filename is the slug. `?raw`
// + eager: the Markdown is bundled as strings and rendered once at module
// load — same code path in the SSR bundle and the browser, so prerendered
// HTML and hydrated HTML are identical. README.md is documentation, not a
// post, hence the negative pattern.
const POST_FILES = import.meta.glob<string>(["./*.md", "!./README.md"], {
  query: "?raw",
  import: "default",
  eager: true,
})

const ALL_POSTS: readonly BlogPost[] = buildPosts(POST_FILES)
const PUBLISHED_POSTS: readonly BlogPost[] = ALL_POSTS.filter((post) => !post.draft)

/** Published posts, newest first. */
export function getAllPosts(): readonly BlogPost[] {
  return PUBLISHED_POSTS
}

/** Every post including drafts (tests, local preview) — newest first. */
export function getAllPostsIncludingDrafts(): readonly BlogPost[] {
  return ALL_POSTS
}

export function getPostBySlug(slug: string, options: { includeDrafts?: boolean } = {}): BlogPost | undefined {
  const source = options.includeDrafts ? ALL_POSTS : PUBLISHED_POSTS
  return source.find((post) => post.slug === slug)
}
