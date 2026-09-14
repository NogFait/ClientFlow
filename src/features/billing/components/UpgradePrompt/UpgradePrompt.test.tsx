import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import UpgradePrompt from "./UpgradePrompt"

describe("UpgradePrompt", () => {
  it("renders the resource name and the limit/current numbers for clientes", () => {
    render(
      <UpgradePrompt isOpen resource="clientes" limit={3} current={3} onClose={() => {}} />,
    )

    expect(screen.getByText(/3\s*\/\s*3/)).toBeInTheDocument()
    expect(screen.getByText(/clientes/i)).toBeInTheDocument()
  })

  it("renders the resource name for proyectos with different numbers (triangulation)", () => {
    render(
      <UpgradePrompt isOpen resource="proyectos" limit={5} current={5} onClose={() => {}} />,
    )

    expect(screen.getByText(/5\s*\/\s*5/)).toBeInTheDocument()
    expect(screen.getByText(/proyectos/i)).toBeInTheDocument()
  })

  it("does not render its content when isOpen is false", () => {
    render(
      <UpgradePrompt isOpen={false} resource="clientes" limit={3} current={3} onClose={() => {}} />,
    )

    expect(screen.queryByText(/clientes/i)).not.toBeInTheDocument()
  })

  it("calls onUpgrade with 'pro_monthly' when the monthly CTA is clicked", async () => {
    const user = userEvent.setup()
    const onUpgrade = vi.fn()
    render(
      <UpgradePrompt isOpen resource="clientes" limit={3} current={3} onClose={() => {}} onUpgrade={onUpgrade} />,
    )

    await user.click(screen.getByRole("button", { name: /mensual/i }))

    expect(onUpgrade).toHaveBeenCalledWith("pro_monthly")
  })

  it("calls onUpgrade with 'pro_yearly' when the annual CTA is clicked", async () => {
    const user = userEvent.setup()
    const onUpgrade = vi.fn()
    render(
      <UpgradePrompt isOpen resource="clientes" limit={3} current={3} onClose={() => {}} onUpgrade={onUpgrade} />,
    )

    await user.click(screen.getByRole("button", { name: /anual/i }))

    expect(onUpgrade).toHaveBeenCalledWith("pro_yearly")
  })
})
