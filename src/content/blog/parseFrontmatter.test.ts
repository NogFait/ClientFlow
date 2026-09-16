import { describe, expect, it } from "vitest"
import { parseFrontmatter } from "./parseFrontmatter"

const RAW = `---
title: "Hola, mundo"
description: Una descripción sin comillas
date: 2026-09-16
draft: false
tags: [lanzamiento, producto]
---

## Primer título

Cuerpo del post.
`

describe("parseFrontmatter", () => {
  it("splits the fenced header from the body", () => {
    const { data, body } = parseFrontmatter(RAW)

    expect(data.title).toBe("Hola, mundo")
    expect(body).toBe("## Primer título\n\nCuerpo del post.\n")
  })

  it("keeps unquoted strings, strips double and single quotes", () => {
    const { data } = parseFrontmatter(`---\na: plain\nb: "double"\nc: 'single'\n---\nx`)

    expect(data).toEqual({ a: "plain", b: "double", c: "single" })
  })

  it("parses true/false as booleans and [a, b] as a string list", () => {
    const { data } = parseFrontmatter(RAW)

    expect(data.draft).toBe(false)
    expect(data.tags).toEqual(["lanzamiento", "producto"])
  })

  it("parses an empty inline list as []", () => {
    const { data } = parseFrontmatter(`---\ntags: []\n---\n`)

    expect(data.tags).toEqual([])
  })

  it("ignores blank lines and # comments inside the header", () => {
    const { data } = parseFrontmatter(`---\n# comentario\n\ntitle: x\n---\nbody`)

    expect(data).toEqual({ title: "x" })
  })

  it("throws when the opening fence is missing", () => {
    expect(() => parseFrontmatter("title: x\n---\nbody")).toThrow(/frontmatter/i)
  })

  it("throws when the closing fence is missing", () => {
    expect(() => parseFrontmatter("---\ntitle: x\nbody")).toThrow(/frontmatter/i)
  })

  it("throws on a header line that is not key: value", () => {
    expect(() => parseFrontmatter("---\nnot a pair\n---\nbody")).toThrow(/line 2/i)
  })

  it("keeps a colon inside the value (only the first one separates key from value)", () => {
    const { data } = parseFrontmatter(`---\ntitle: Lanzamiento: ya está\n---\n`)

    expect(data.title).toBe("Lanzamiento: ya está")
  })

  it("tolerates CRLF line endings", () => {
    const { data, body } = parseFrontmatter("---\r\ntitle: x\r\n---\r\nbody\r\n")

    expect(data.title).toBe("x")
    expect(body).toBe("body\n")
  })
})
