import { describe, expect, it } from "vitest"
import { buildPost, buildPosts } from "./loadPosts"

const file = (title: string, date: string, extra = "") =>
  `---\ntitle: ${title}\ndescription: Desc de ${title}\ndate: ${date}\n${extra}---\n\n## Hola\n\nTexto.\n`

describe("buildPost", () => {
  it("derives every BlogPost field from the slug and raw file", () => {
    const post = buildPost("hola-mundo", file("Hola", "2026-09-16", "tags: [a, b]\n"))

    expect(post).toMatchObject({
      slug: "hola-mundo",
      title: "Hola",
      description: "Desc de Hola",
      date: "2026-09-16",
      author: "Fausto Chirino",
      draft: false,
      tags: ["a", "b"],
      body: "## Hola\n\nTexto.\n",
      readingMinutes: 1,
    })
    expect(post.html).toContain("<h2>Hola</h2>")
  })

  it("honours an explicit author and draft flag", () => {
    const post = buildPost("x", file("X", "2026-01-01", "author: Otra Persona\ndraft: true\n"))

    expect(post.author).toBe("Otra Persona")
    expect(post.draft).toBe(true)
    expect(post.tags).toEqual([])
  })

  it("throws with the slug and every validation error when the post is invalid", () => {
    expect(() => buildPost("Bad Slug", "---\ntitle: x\n---\n# h1\n")).toThrow(/Bad Slug[\s\S]*slug[\s\S]*description[\s\S]*date[\s\S]*# /)
  })
})

describe("buildPosts", () => {
  it("maps glob paths to slugs and sorts by date descending (drafts included)", () => {
    const posts = buildPosts({
      "./viejo.md": file("Viejo", "2025-01-01"),
      "./nuevo.md": file("Nuevo", "2026-09-16"),
      "./borrador.md": file("Borrador", "2026-06-01", "draft: true\n"),
    })

    expect(posts.map((post) => post.slug)).toEqual(["nuevo", "borrador", "viejo"])
  })

  it("breaks date ties by slug so the order is stable across platforms", () => {
    const posts = buildPosts({ "./b.md": file("B", "2026-01-01"), "./a.md": file("A", "2026-01-01") })

    expect(posts.map((post) => post.slug)).toEqual(["a", "b"])
  })

  it("rejects two files that would map to the same slug", () => {
    expect(() => buildPosts({ "./a.md": file("A", "2026-01-01"), "/abs/a.md": file("A2", "2026-01-01") })).toThrow(
      /duplicate slug/,
    )
  })
})
