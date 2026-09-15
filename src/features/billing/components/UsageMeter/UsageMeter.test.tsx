import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import UsageMeter from "./UsageMeter"

describe("UsageMeter", () => {
  it("shows 'used / limit' when the resource has a numeric limit", () => {
    render(<UsageMeter label="Clientes" used={2} limit={3} />)
    expect(screen.getByText("Clientes")).toBeInTheDocument()
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
  })

  it("shows 'ilimitado' when the limit is null (triangulation: Pro plan)", () => {
    render(<UsageMeter label="Proyectos" used={12} limit={null} />)
    expect(screen.getByText(/12/)).toBeInTheDocument()
    expect(screen.getByText(/ilimitado/i)).toBeInTheDocument()
  })

  it("exposes progress semantics for assistive tech when at the limit (triangulation: different numbers, edge case)", () => {
    render(<UsageMeter label="Clientes" used={5} limit={5} />)
    const meter = screen.getByRole("progressbar")
    expect(meter).toHaveAttribute("aria-valuenow", "5")
    expect(meter).toHaveAttribute("aria-valuemax", "5")
  })
})
