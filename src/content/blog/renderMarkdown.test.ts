import { describe, expect, it } from "vitest"
import { renderMarkdown } from "./renderMarkdown"

describe("renderMarkdown", () => {
  it("renders headings, paragraphs and inline formatting", () => {
    const html = renderMarkdown("## Título\n\nHola **mundo** con `code`.\n")

    expect(html).toContain("<h2>Título</h2>")
    expect(html).toContain("<p>Hola <strong>mundo</strong> con <code>code</code>.</p>")
  })

  it("renders GFM tables and strikethrough", () => {
    const html = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |\n\n~~no~~\n")

    expect(html).toContain("<table>")
    expect(html).toContain("<del>no</del>")
  })

  it("does not inject heading ids or a mangled mailto (identical output on server and client)", () => {
    const html = renderMarkdown("## Sección\n\nhola@clientflow.lat\n")

    expect(html).toContain("<h2>Sección</h2>")
    expect(html).toContain("hola@clientflow.lat")
    expect(html).not.toMatch(/&#/)
  })

  it("is deterministic for the same input", () => {
    const source = "## A\n\n- uno\n- dos\n\n> cita\n"

    expect(renderMarkdown(source)).toBe(renderMarkdown(source))
  })
})
