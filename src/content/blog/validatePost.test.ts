import { describe, expect, it } from "vitest"
import { validatePost } from "./validatePost"

const VALID = {
  slug: "clientflow-ya-esta-disponible",
  data: {
    title: "ClientFlow ya está disponible",
    description: "Una descripción corta.",
    date: "2026-09-16",
  },
  body: "## Sección\n\nTexto.\n",
}

describe("validatePost", () => {
  it("returns no errors for a valid post", () => {
    expect(validatePost(VALID)).toEqual([])
  })

  it("requires title, description and date", () => {
    const errors = validatePost({ ...VALID, data: {} })

    expect(errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/title/), expect.stringMatching(/description/), expect.stringMatching(/date/)]),
    )
  })

  it("rejects a description longer than 160 characters", () => {
    const errors = validatePost({ ...VALID, data: { ...VALID.data, description: "x".repeat(161) } })

    expect(errors).toEqual([expect.stringMatching(/description.*160/)])
    expect(validatePost({ ...VALID, data: { ...VALID.data, description: "x".repeat(160) } })).toEqual([])
  })

  it("rejects a date that is not YYYY-MM-DD", () => {
    expect(validatePost({ ...VALID, data: { ...VALID.data, date: "16-09-2026" } })).toEqual([
      expect.stringMatching(/date.*YYYY-MM-DD/),
    ])
  })

  it("rejects a slug that is not kebab-case", () => {
    expect(validatePost({ ...VALID, slug: "Hola_Mundo" })).toEqual([expect.stringMatching(/slug.*kebab/)])
    expect(validatePost({ ...VALID, slug: "-leading" })).toEqual([expect.stringMatching(/slug/)])
    expect(validatePost({ ...VALID, slug: "double--dash" })).toEqual([expect.stringMatching(/slug/)])
  })

  it("rejects a level-1 heading in the body (the page owns the <h1>)", () => {
    expect(validatePost({ ...VALID, body: "Intro\n\n# Título\n\nTexto" })).toEqual([expect.stringMatching(/# /)])
    // A "#" inside a fenced code block is not a heading.
    expect(validatePost({ ...VALID, body: "```sh\n# comment\n```\n" })).toEqual([])
    // Level 2+ headings are fine.
    expect(validatePost({ ...VALID, body: "## ok\n### ok\n" })).toEqual([])
  })

  it("rejects non-boolean draft and non-list tags", () => {
    expect(validatePost({ ...VALID, data: { ...VALID.data, draft: "yes" } })).toEqual([expect.stringMatching(/draft/)])
    expect(validatePost({ ...VALID, data: { ...VALID.data, tags: "a" } })).toEqual([expect.stringMatching(/tags/)])
  })
})

describe("validatePost — raw HTML", () => {
  it("rejects a <script> tag in the body (marked passes raw HTML through)", () => {
    expect(validatePost({ ...VALID, body: "Hola\n\n<script>alert(1)</script>\n" })).toEqual([
      expect.stringMatching(/<script/),
    ])
    expect(validatePost({ ...VALID, body: "Hola <SCRIPT src=x></SCRIPT>" })).toHaveLength(1)
  })
})
