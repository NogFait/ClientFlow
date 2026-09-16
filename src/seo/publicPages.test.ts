import { describe, expect, it } from "vitest"
import { getPublicPages, toSitemapEntries } from "./publicPages"
import { PUBLIC_PATHS, PUBLIC_PAGE_META } from "../content/pageMeta"
import { getAllPosts, getAllPostsIncludingDrafts } from "../content/blog"
import { SITE_URL } from "../content/site"

describe("getPublicPages", () => {
  const pages = getPublicPages()
  const paths = pages.map((page) => page.path)

  it("lists the 4 static routes, /blog and one entry per PUBLISHED post — no drafts", () => {
    const published = getAllPosts().map((post) => `/blog/${post.slug}`)
    const drafts = getAllPostsIncludingDrafts()
      .filter((post) => post.draft)
      .map((post) => `/blog/${post.slug}`)

    expect(paths).toEqual([...PUBLIC_PATHS, "/blog", ...published])
    drafts.forEach((draftPath) => expect(paths).not.toContain(draftPath))
    expect(new Set(paths).size).toBe(paths.length)
  })

  it("reuses PUBLIC_PAGE_META for the static routes", () => {
    PUBLIC_PATHS.forEach((path) => {
      expect(pages.find((page) => page.path === path)).toMatchObject(PUBLIC_PAGE_META[path])
    })
  })

  it("gives every page a non-empty title/description and the agreed priorities", () => {
    pages.forEach((page) => {
      expect(page.title.trim()).not.toBe("")
      expect(page.description.trim()).not.toBe("")
    })
    const priorityOf = (path: string) => pages.find((page) => page.path === path)?.priority
    expect(priorityOf("/")).toBe(1)
    expect(priorityOf("/pricing")).toBe(0.8)
    expect(priorityOf("/blog")).toBe(0.7)
    expect(priorityOf("/terms")).toBe(0.3)
    expect(priorityOf("/privacy")).toBe(0.3)
    getAllPosts().forEach((post) => expect(priorityOf(`/blog/${post.slug}`)).toBe(0.6))
  })

  it("carries the post date as lastmod for posts and no lastmod for static pages", () => {
    getAllPosts().forEach((post) => {
      expect(pages.find((page) => page.path === `/blog/${post.slug}`)?.lastmod).toBe(post.date)
    })
    PUBLIC_PATHS.forEach((path) => expect(pages.find((page) => page.path === path)?.lastmod).toBeUndefined())
  })

  it("titles a post page '<title> — ClientFlow' with the post description", () => {
    const [post] = getAllPosts()
    expect(pages.find((page) => page.path === `/blog/${post.slug}`)).toMatchObject({
      title: `${post.title} — ClientFlow`,
      description: post.description,
    })
  })
})

describe("toSitemapEntries", () => {
  it("builds absolute locs and fills the missing lastmod with the given date", () => {
    const entries = toSitemapEntries(
      [
        { path: "/", title: "t", description: "d", priority: 1 },
        { path: "/blog/x", title: "t", description: "d", priority: 0.6, lastmod: "2026-09-16" },
      ],
      "2027-01-02",
    )

    expect(entries).toEqual([
      { loc: `${SITE_URL}/`, lastmod: "2027-01-02", priority: 1 },
      { loc: `${SITE_URL}/blog/x`, lastmod: "2026-09-16", priority: 0.6 },
    ])
  })
})
