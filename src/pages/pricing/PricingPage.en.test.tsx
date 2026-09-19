import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderWithLang } from "../../test/i18n"
import PricingPage from "./PricingPage"

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => ({ hasSession: false, loading: false }),
}))

vi.mock("../../features/billing/hooks/useCheckout", () => ({
  useCheckout: () => ({ upgrade: vi.fn(), manage: vi.fn(), loading: false, error: null }),
}))

describe("PricingPage — English (/en/pricing)", () => {
  it("renders the English hero, toggle, plan cards and FAQ", async () => {
    const user = userEvent.setup()
    renderWithLang(<PricingPage />, "en", { initialEntries: ["/en/pricing"] })

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Start for free. Pay when you grow.")
    expect(document.title).toBe("Pricing — ClientFlow")
    expect(screen.getByRole("group", { name: "Billing interval" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Choose Pro monthly" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create a free account" })).toBeInTheDocument()
    expect(screen.getByText("/month")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Yearly" }))

    expect(screen.getByRole("button", { name: "Choose Pro yearly" })).toBeInTheDocument()
    expect(screen.getByText("/year")).toBeInTheDocument()
    expect(screen.getByText("2 months free")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Do I need a card to get started\?/i })).toBeInTheDocument()
  })
})
