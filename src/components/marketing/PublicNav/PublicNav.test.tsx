import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import PublicNav from "./PublicNav"
import { renderWithLang } from "../../../test/i18n"

let hasSessionValue: { hasSession: boolean; loading: boolean }

vi.mock("../../../hooks/useHasSession", () => ({
  useHasSession: () => hasSessionValue,
}))

function renderNav() {
  render(
    <MemoryRouter>
      <PublicNav />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  hasSessionValue = { hasSession: false, loading: false }
})

describe("PublicNav", () => {
  it("shows Iniciar sesión and Empezar gratis links when there is no session", () => {
    renderNav()

    expect(screen.getByRole("link", { name: /Iniciar sesión/i })).toHaveAttribute("href", "/login")
    expect(screen.getByRole("link", { name: /Empezar gratis/i })).toHaveAttribute("href", "/register")
  })

  it("shows 'Ir al dashboard' instead when a session exists (triangulation: authenticated visitor)", () => {
    hasSessionValue = { hasSession: true, loading: false }
    renderNav()

    expect(screen.getByRole("link", { name: /Ir al dashboard/i })).toHaveAttribute("href", "/dashboard")
    expect(screen.queryByRole("link", { name: /Iniciar sesión/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Empezar gratis/i })).not.toBeInTheDocument()
  })

  it("opens the mobile menu on hamburger click and closes it again on a second click", async () => {
    const user = userEvent.setup()
    renderNav()

    const toggle = screen.getByRole("button", { name: /Abrir menú/i })
    expect(toggle).toHaveAttribute("aria-expanded", "false")

    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")

    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "false")
  })
})

describe("PublicNav — blog", () => {
  it("links to /blog in the desktop nav and in the mobile menu", async () => {
    const user = userEvent.setup()
    renderNav()

    expect(screen.getAllByRole("link", { name: "Blog" })).toHaveLength(1)
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blog")

    await user.click(screen.getByRole("button", { name: /Abrir menú/i }))
    const links = screen.getAllByRole("link", { name: "Blog" })
    expect(links).toHaveLength(2)
    links.forEach((link) => expect(link).toHaveAttribute("href", "/blog"))
  })
})

// The three section links are anchors that only exist on the landing. From
// any other public page (blog, pricing, legal) they must route back to the
// landing — in the current language — and then jump to the section.
describe("PublicNav — section links off the landing", () => {
  function renderNavAt(path: string) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <PublicNav />
      </MemoryRouter>,
    )
  }

  it("uses plain in-page anchors on the landing", () => {
    renderNavAt("/")
    expect(screen.getAllByRole("link", { name: /Cómo funciona/i })[0]).toHaveAttribute("href", "#como")
  })

  it("routes to the landing anchors from the blog", () => {
    renderNavAt("/blog")
    expect(screen.getAllByRole("link", { name: /Cómo funciona/i })[0]).toHaveAttribute("href", "/#como")
    expect(screen.getAllByRole("link", { name: /^Precios$/i })[0]).toHaveAttribute("href", "/#precios")
    expect(screen.getAllByRole("link", { name: /Preguntas/i })[0]).toHaveAttribute("href", "/#faq")
  })

  it("keeps the language when routing back from an English page", () => {
    renderWithLang(<PublicNav />, "en", { initialEntries: ["/en/pricing"] })
    expect(screen.getAllByRole("link", { name: /How it works/i })[0]).toHaveAttribute("href", "/en#como")
  })
})
