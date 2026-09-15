import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import LandingPage from "./LandingPage"
import { PLAN_CATALOG } from "../../features/billing/domain/planCatalog"

let hasSessionValue: { hasSession: boolean; loading: boolean }

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => hasSessionValue,
}))

function renderLanding() {
  render(
    <MemoryRouter>
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
