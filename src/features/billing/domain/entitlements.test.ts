import { describe, expect, it } from "vitest"
import { canCreate, isPro, remaining } from "./entitlements"
import type { Entitlements } from "../types"

function makeEntitlements(overrides: Partial<Entitlements> = {}): Entitlements {
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

describe("canCreate", () => {
  it("allows creating a cliente when usage is below the Free limit", () => {
    const ent = makeEntitlements({ usage: { clientes: 2, proyectos: 0 } })
    expect(canCreate(ent, "clientes")).toBe(true)
  })

  it("blocks creating a cliente when usage has reached the Free limit", () => {
    const ent = makeEntitlements({ usage: { clientes: 3, proyectos: 0 } })
    expect(canCreate(ent, "clientes")).toBe(false)
  })

  it("blocks creating a proyecto when usage has reached its own (different) Free limit", () => {
    const ent = makeEntitlements({ usage: { clientes: 0, proyectos: 5 } })
    expect(canCreate(ent, "proyectos")).toBe(false)
  })

  it("always allows creating when the resource limit is unlimited (null)", () => {
    const ent = makeEntitlements({
      plan: "pro_monthly",
      status: "active",
      limits: { clientes: null, proyectos: null },
      usage: { clientes: 999, proyectos: 999 },
    })
    expect(canCreate(ent, "clientes")).toBe(true)
    expect(canCreate(ent, "proyectos")).toBe(true)
  })

  it("defaults to allowing (soft check) when entitlements have not loaded yet", () => {
    expect(canCreate(null, "clientes")).toBe(true)
  })
})

describe("remaining", () => {
  it("returns the number of slots left for a limited resource", () => {
    const ent = makeEntitlements({ usage: { clientes: 1, proyectos: 0 } })
    expect(remaining(ent, "clientes")).toBe(2)
  })

  it("clamps to zero instead of going negative when over the limit", () => {
    const ent = makeEntitlements({ usage: { clientes: 5, proyectos: 0 } })
    expect(remaining(ent, "clientes")).toBe(0)
  })

  it("returns null for an unlimited resource", () => {
    const ent = makeEntitlements({
      plan: "pro_yearly",
      limits: { clientes: null, proyectos: 5 },
    })
    expect(remaining(ent, "clientes")).toBeNull()
  })
})

describe("isPro", () => {
  it("is false for the free plan", () => {
    expect(isPro(makeEntitlements({ plan: "free" }))).toBe(false)
  })

  it("is true for pro_monthly", () => {
    expect(isPro(makeEntitlements({ plan: "pro_monthly", status: "active" }))).toBe(true)
  })

  it("is true for pro_yearly", () => {
    expect(isPro(makeEntitlements({ plan: "pro_yearly", status: "active" }))).toBe(true)
  })

  it("is false when entitlements have not loaded yet", () => {
    expect(isPro(null)).toBe(false)
  })
})
