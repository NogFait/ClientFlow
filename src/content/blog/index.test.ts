import { describe, expect, it } from "vitest"
import { getAllPosts, getAllPostsIncludingDrafts, getPostBySlug } from "./index"
import { validatePost } from "./validatePost"
import { parseFrontmatter } from "./parseFrontmatter"

// Guard over the REAL content: any post whose frontmatter/body breaks the
// rules fails CI here (and the build, which imports the same module).
const RAW_FILES = import.meta.glob<string>(["./*.md", "!./README.md"], {
  query: "?raw",
  import: "default",
  eager: true,
})

describe("src/content/blog/*.md", () => {
  it("has at least one post file", () => {
    expect(Object.keys(RAW_FILES).length).toBeGreaterThan(0)
  })

  it("every post file is valid (frontmatter, description ≤160, date, slug, no h1, no script)", () => {
    Object.entries(RAW_FILES).forEach(([filePath, raw]) => {
      const slug = filePath.replace(/^.*\//, "").replace(/\.md$/, "")
      const { data, body } = parseFrontmatter(raw)
      expect(validatePost({ slug, data, body }), filePath).toEqual([])
    })
  })

  it("loads every file as a post (drafts included) and exposes only published ones publicly", () => {
    const all = getAllPostsIncludingDrafts()
    const published = getAllPosts()

    expect(all).toHaveLength(Object.keys(RAW_FILES).length)
    expect(published.every((post) => !post.draft)).toBe(true)
    expect(published.length).toBeLessThanOrEqual(all.length)
  })

  it("returns published posts newest first", () => {
    const dates = getAllPosts().map((post) => post.date)
    const sorted = [...dates].sort().reverse()
    expect(dates).toEqual(sorted)
  })

  it("finds a published post by slug and returns undefined for an unknown one", () => {
    const [first] = getAllPosts()
    expect(getPostBySlug(first.slug)).toBe(first)
    expect(getPostBySlug("no-existe")).toBeUndefined()
  })

  it("includes the launch post, published on 2026-09-16 with the contact email in the body", () => {
    const post = getPostBySlug("clientflow-ya-esta-disponible")
    expect(post).toBeDefined()
    expect(post?.date).toBe("2026-09-16")
    expect(post?.draft).toBe(false)
    expect(post?.html).toContain("mailto:hola@clientflow.lat")
    expect(post?.html).not.toContain("<h1")
  })
})
