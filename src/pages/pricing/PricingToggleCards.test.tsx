import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PricingToggleCards from "./PricingToggleCards"
import { getPlanCatalogEntry } from "../../features/billing/domain/planCatalog"

describe("PricingToggleCards", () => {
  it("shows the Pro monthly price from the catalog by default", () => {
    render(<PricingToggleCards onSelectPlan={vi.fn()} />)

    const monthly = getPlanCatalogEntry("pro_monthly")
    expect(screen.getByText(monthly.price)).toBeInTheDocument()
  })

  it("toggling to Anual switches the displayed Pro price to the catalog's yearly price (spec: toggles interval)", async () => {
    const user = userEvent.setup()
    render(<PricingToggleCards onSelectPlan={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Anual/i }))

    const yearly = getPlanCatalogEntry("pro_yearly")
    const monthly = getPlanCatalogEntry("pro_monthly")
    expect(screen.getByText(yearly.price)).toBeInTheDocument()
    expect(screen.queryByText(monthly.price)).not.toBeInTheDocument()
  })

  it("toggling back to Mensual restores the monthly price (triangulation: round trip)", async () => {
    const user = userEvent.setup()
    render(<PricingToggleCards onSelectPlan={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Anual/i }))
    await user.click(screen.getByRole("button", { name: /Mensual/i }))

    const monthly = getPlanCatalogEntry("pro_monthly")
    expect(screen.getByText(monthly.price)).toBeInTheDocument()
  })

  it("calls onSelectPlan('pro_monthly') when the Pro CTA is clicked in the default (monthly) interval", async () => {
    const user = userEvent.setup()
    const onSelectPlan = vi.fn()
    render(<PricingToggleCards onSelectPlan={onSelectPlan} />)

    await user.click(screen.getByRole("button", { name: /Elegir Pro/i }))

    expect(onSelectPlan).toHaveBeenCalledWith("pro_monthly")
  })

  it("calls onSelectPlan('pro_yearly') when the Pro CTA is clicked after toggling to Anual (triangulation: different plan code)", async () => {
    const user = userEvent.setup()
    const onSelectPlan = vi.fn()
    render(<PricingToggleCards onSelectPlan={onSelectPlan} />)

    await user.click(screen.getByRole("button", { name: /Anual/i }))
    await user.click(screen.getByRole("button", { name: /Elegir Pro/i }))

    expect(onSelectPlan).toHaveBeenCalledWith("pro_yearly")
  })

  it("calls onSelectPlan('free') when the Free CTA is clicked", async () => {
    const user = userEvent.setup()
    const onSelectPlan = vi.fn()
    render(<PricingToggleCards onSelectPlan={onSelectPlan} />)

    await user.click(screen.getByRole("button", { name: /gratis/i }))

    expect(onSelectPlan).toHaveBeenCalledWith("free")
  })
})
