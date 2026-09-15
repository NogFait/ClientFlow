import { describe, expect, it } from "vitest"
import { resolvePlanCardState } from "./planCardState"
import type { Entitlements } from "../types"

function makeEntitlements(overrides: Partial<Entitlements>): Entitlements {
  return {
    plan: "free",
    status: "free",
    limits: { clientes: 3, proyectos: 5 },
    usage: { clientes: 0, proyectos: 0 },
    current_period_end: null,
    cancel_at_period_end: false,
    grace_until: null,
    ...overrides,
  }
}

describe("resolvePlanCardState", () => {
  it("free user: free card is current, both pro cards offer upgrade, pro_yearly is recommended", () => {
    const entitlements = makeEntitlements({ plan: "free", status: "free" })

    expect(resolvePlanCardState(entitlements, "free")).toEqual({
      isCurrent: true,
      isRecommended: false,
      cta: "current",
    })
    expect(resolvePlanCardState(entitlements, "pro_monthly")).toEqual({
      isCurrent: false,
      isRecommended: false,
      cta: "upgrade",
    })
    expect(resolvePlanCardState(entitlements, "pro_yearly")).toEqual({
      isCurrent: false,
      isRecommended: true,
      cta: "upgrade",
    })
  })

  it("pro_monthly active user: pro_monthly is current, free has no CTA, pro_yearly stays recommended (triangulation)", () => {
    const entitlements = makeEntitlements({
      plan: "pro_monthly",
      status: "active",
      limits: { clientes: null, proyectos: null },
    })

    expect(resolvePlanCardState(entitlements, "free")).toEqual({
      isCurrent: false,
      isRecommended: false,
      cta: "none",
    })
    expect(resolvePlanCardState(entitlements, "pro_monthly")).toEqual({
      isCurrent: true,
      isRecommended: false,
      cta: "current",
    })
    expect(resolvePlanCardState(entitlements, "pro_yearly")).toEqual({
      isCurrent: false,
      isRecommended: true,
      cta: "upgrade",
    })
  })

  it("pro_yearly active user: pro_yearly is current and loses the recommended accent (triangulation)", () => {
    const entitlements = makeEntitlements({
      plan: "pro_yearly",
      status: "active",
      limits: { clientes: null, proyectos: null },
    })

    expect(resolvePlanCardState(entitlements, "pro_yearly")).toEqual({
      isCurrent: true,
      isRecommended: false,
      cta: "current",
    })
    expect(resolvePlanCardState(entitlements, "pro_monthly").cta).toBe("upgrade")
  })

  it("past_due user keeps their paid plan marked current (still has Pro access) (triangulation)", () => {
    const entitlements = makeEntitlements({
      plan: "pro_yearly",
      status: "past_due",
      limits: { clientes: null, proyectos: null },
    })

    expect(resolvePlanCardState(entitlements, "pro_yearly")).toEqual({
      isCurrent: true,
      isRecommended: false,
      cta: "current",
    })
    expect(resolvePlanCardState(entitlements, "free").cta).toBe("none")
  })

  it("canceled (terminal) user: no active paid plan, so Free is current again and Pro cards offer upgrade (triangulation)", () => {
    const entitlements = makeEntitlements({ plan: "pro_monthly", status: "canceled" })

    expect(resolvePlanCardState(entitlements, "free")).toEqual({
      isCurrent: true,
      isRecommended: false,
      cta: "current",
    })
    expect(resolvePlanCardState(entitlements, "pro_monthly")).toEqual({
      isCurrent: false,
      isRecommended: false,
      cta: "upgrade",
    })
  })
})
