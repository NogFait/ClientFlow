import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import PlanBadge from "./PlanBadge"

describe("PlanBadge", () => {
  it("shows 'Free' for the free plan", () => {
    render(<PlanBadge plan="free" status="free" />)
    expect(screen.getByText("Free")).toBeInTheDocument()
  })

  it("shows 'Pro mensual' for an active pro_monthly plan (triangulation: different plan/status)", () => {
    render(<PlanBadge plan="pro_monthly" status="active" />)
    expect(screen.getByText("Pro mensual")).toBeInTheDocument()
  })

  it("appends a past_due indicator for pro_yearly (triangulation: different plan/status combo)", () => {
    render(<PlanBadge plan="pro_yearly" status="past_due" />)
    expect(screen.getByText(/Pro anual/)).toBeInTheDocument()
    expect(screen.getByText(/Pago pendiente/)).toBeInTheDocument()
  })

  it("appends a canceled indicator when status is canceled", () => {
    render(<PlanBadge plan="pro_monthly" status="canceled" />)
    expect(screen.getByText(/Pro mensual/)).toBeInTheDocument()
    expect(screen.getByText(/Cancelado/)).toBeInTheDocument()
  })

  it("compact mode hides the status suffix, keeping only the plan name (navbar usage)", () => {
    render(<PlanBadge plan="pro_yearly" status="past_due" compact />)
    expect(screen.getByText("Pro anual")).toBeInTheDocument()
    expect(screen.queryByText(/Pago pendiente/)).not.toBeInTheDocument()
  })
})
