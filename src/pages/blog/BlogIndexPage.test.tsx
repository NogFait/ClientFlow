import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import type { BlogPost } from "../../content/blog/types"

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => ({ hasSession: false, loading: false }),
}))

let posts: BlogPost[]
vi.mock("../../content/blog", () => ({
  getAllPosts: () => posts,
}))

import BlogIndexPage from "./BlogIndexPage"

const POST: BlogPost = {
  slug: "hola-mundo",
  title: "Hola mundo",
  description: "El primer post del blog.",
  date: "2026-09-16",
  author: "Fausto Chirino",
  draft: false,
  tags: [],
  body: "## Hola",
  html: "<h2>Hola</h2>",
  readingMinutes: 3,
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/blog"]}>
      <BlogIndexPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  posts = [POST]
  document.title = ""
})

describe("BlogIndexPage", () => {
  it("renders the h1, sets the title and shows nav + footer", () => {
    renderPage()

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Blog")
    expect(document.title).toBe("Blog — ClientFlow")
    expect(screen.getByRole("link", { name: /Empezar gratis/i })).toHaveAttribute("href", "/register")
    expect(screen.getByRole("link", { name: /Términos/i })).toHaveAttribute("href", "/terms")
  })

  it("lists each post as a card: linked title, Spanish date, reading time and description", () => {
    renderPage()

    expect(screen.getByRole("link", { name: "Hola mundo" })).toHaveAttribute("href", "/blog/hola-mundo")
    expect(screen.getByText("16 de septiembre de 2026")).toBeInTheDocument()
    expect(screen.getByText(/3 min de lectura/)).toBeInTheDocument()
    expect(screen.getByText("El primer post del blog.")).toBeInTheDocument()
  })

  it("shows an empty state when there are no published posts", () => {
    posts = []
    renderPage()

    expect(screen.getByText(/Todavía no hay posts/i)).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })
})
