import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { BlogPost } from "../../content/blog/types"

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => ({ hasSession: false, loading: false }),
}))

const POST: BlogPost = {
  slug: "hola-mundo",
  title: "Hola mundo",
  description: "El primer post del blog.",
  date: "2026-09-16",
  author: "Fausto Chirino",
  draft: false,
  tags: [],
  body: "## Sección\n\nTexto del post.",
  html: "<h2>Sección</h2>\n<p>Texto del post.</p>\n",
  readingMinutes: 2,
}
const DRAFT: BlogPost = { ...POST, slug: "borrador", title: "Borrador", draft: true }

vi.mock("../../content/blog", () => ({
  getPostBySlug: (slug: string, options: { includeDrafts?: boolean } = {}) =>
    [POST, DRAFT].find((post) => post.slug === slug && (options.includeDrafts || !post.draft)),
}))

import BlogPostPage from "./BlogPostPage"

function renderAt(slug: string) {
  render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  document.title = ""
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("BlogPostPage", () => {
  it("renders the article: h1 title, meta line, rendered HTML, back link and CTA", () => {
    renderAt("hola-mundo")

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hola mundo")
    expect(screen.getByText("16 de septiembre de 2026")).toBeInTheDocument()
    expect(screen.getByText(/2 min de lectura/)).toBeInTheDocument()
    expect(screen.getByText("Fausto Chirino")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Sección" })).toBeInTheDocument()
    expect(screen.getByText("Texto del post.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Volver al blog/ })).toHaveAttribute("href", "/blog")
    expect(screen.getAllByRole("link", { name: /Empezar gratis/i })[0]).toHaveAttribute("href", "/register")
  })

  it("sets the page title/description from the post", () => {
    renderAt("hola-mundo")

    expect(document.title).toBe("Hola mundo — ClientFlow")
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "El primer post del blog.",
    )
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://clientflow.lat/blog/hola-mundo",
    )
  })

  it("embeds BlogPosting JSON-LD", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/blog/hola-mundo"]}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    expect(JSON.parse(script!.textContent ?? "")).toMatchObject({
      "@type": "BlogPosting",
      headline: "Hola mundo",
      mainEntityOfPage: "https://clientflow.lat/blog/hola-mundo",
    })
  })

  it("renders the 404 page for an unknown slug", () => {
    renderAt("no-existe")

    expect(screen.getByText("La página que buscas no existe.")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 1, name: "Hola mundo" })).not.toBeInTheDocument()
  })

  it("hides drafts in production builds but previews them in dev", () => {
    vi.stubEnv("DEV", false)
    renderAt("borrador")
    expect(screen.getByText("La página que buscas no existe.")).toBeInTheDocument()

    vi.stubEnv("DEV", true)
    renderAt("borrador")
    expect(screen.getByRole("heading", { level: 1, name: "Borrador" })).toBeInTheDocument()
  })
})
