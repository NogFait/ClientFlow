import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import LandingPage from "./LandingPage"
import { PLAN_CATALOG } from "../../features/billing/domain/planCatalog"

let hasSessionValue: { hasSession: boolean; loading: boolean }

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => hasSessionValue,
}))

function renderLanding(initialEntries: string[] = ["/"]) {
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <LandingPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  hasSessionValue = { hasSession: false, loading: false }
  document.title = ""
})

describe("LandingPage", () => {
  it("renders the hero headline and sets the document title", () => {
    renderLanding()

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Tus clientes, proyectos y cobros. En un solo lugar.",
    )
    expect(document.title).toBe("ClientFlow — CRM para freelancers")
  })

  it("renders the pricing section from the plan catalog", () => {
    renderLanding()

    PLAN_CATALOG.forEach((entry) => {
      expect(screen.getByText(entry.price)).toBeInTheDocument()
    })
  })

  it("renders the FAQ accordion with the first question open", () => {
    renderLanding()

    const faqButtons = screen.getAllByRole("button", { name: /¿/i })
    expect(faqButtons[0]).toHaveAttribute("aria-expanded", "true")
  })

  it("shows 'Ir al dashboard' in the nav instead of login/registro when a session exists (triangulation)", () => {
    hasSessionValue = { hasSession: true, loading: false }
    renderLanding()

    expect(screen.getByRole("link", { name: /Ir al dashboard/i })).toHaveAttribute("href", "/dashboard")
  })
})

describe("LandingPage — hash scroll on cold load (task 3.x, /#precios)", () => {
  const scrollIntoViewMock = vi.fn()

  beforeEach(() => {
    scrollIntoViewMock.mockReset()
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("scrolls the #precios section into view smoothly when the route mounts with that hash", () => {
    renderLanding(["/#precios"])

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1)
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" })
    expect(scrollIntoViewMock.mock.instances[0]).toHaveProperty("id", "precios")
  })

  it("does not scroll when the URL has no hash (triangulation)", () => {
    renderLanding(["/"])

    expect(scrollIntoViewMock).not.toHaveBeenCalled()
  })

  it("uses 'auto' behavior when the visitor prefers reduced motion (triangulation)", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }))

    renderLanding(["/#precios"])

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "auto" })
  })

  it("does not scroll when the hash doesn't match any section id (triangulation)", () => {
    renderLanding(["/#no-existe"])

    expect(scrollIntoViewMock).not.toHaveBeenCalled()
  })
})
