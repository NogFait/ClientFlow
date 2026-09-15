import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import PricingSection from "./PricingSection"
import { PLAN_CATALOG } from "../../../features/billing/domain/planCatalog"

function renderSection() {
  render(
    <MemoryRouter>
      <PricingSection />
    </MemoryRouter>,
  )
}

describe("PricingSection", () => {
  it("renders one card per catalog entry, in catalog order, with the catalog price (not a hardcoded literal)", () => {
    renderSection()

    const headings = screen.getAllByRole("heading", { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual(PLAN_CATALOG.map((entry) => entry.name))

    PLAN_CATALOG.forEach((entry) => {
      expect(screen.getByText(entry.price)).toBeInTheDocument()
    })
  })

  it("shows the recommended badge text from the catalog entry that has one (triangulation: pro_yearly)", () => {
    renderSection()

    const yearly = PLAN_CATALOG.find((entry) => entry.code === "pro_yearly")
    expect(yearly?.badge).toBeTruthy()
    expect(screen.getByText(yearly!.badge!)).toBeInTheDocument()
  })

  it("links every plan's CTA to /register carrying that plan's code as a query param", () => {
    renderSection()

    PLAN_CATALOG.forEach((entry) => {
      const link = screen.getByRole("link", { name: new RegExp(entry.name === "Free" ? "gratis" : entry.name, "i") })
      expect(link).toHaveAttribute("href", `/register?plan=${entry.code}`)
    })
  })
})
