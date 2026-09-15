import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BarChart } from "./BarChart"
import { formatCurrency } from "../../utils/currency"

// getByText's default normalizer collapses the NBSP formatCurrency puts
// between "$" and the digits down to a regular space before comparing (same
// note as PaymentsPage.test.tsx / DashboardPage.test.tsx).
const money = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, " ")

describe("BarChart — tooltip currency formatting (es-AR)", () => {
  it("shows the hovered bar's value through the shared es-AR formatter", async () => {
    const user = userEvent.setup()
    const { container } = render(<BarChart data={[{ key: "Septiembre 2026", value: 1500000 }]} />)

    // Single data point → single bar → single hover trigger (the <span> that
    // TooltipTrigger wraps around the bar <div>).
    const trigger = container.querySelector('span[style*="inline-block"]')!
    await user.hover(trigger)

    expect(await screen.findByText(money(1500000))).toBeInTheDocument()
  })

  it("renders nothing (no crash, no tooltip) when data is empty (triangulation)", () => {
    const { container } = render(<BarChart data={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
