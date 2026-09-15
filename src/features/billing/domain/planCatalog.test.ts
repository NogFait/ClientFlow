import { describe, expect, it } from "vitest"
import { PLAN_CATALOG, getPlanCatalogEntry } from "./planCatalog"

describe("planCatalog", () => {
  it("lists the three plans in free -> pro_monthly -> pro_yearly order", () => {
    expect(PLAN_CATALOG.map((entry) => entry.code)).toEqual(["free", "pro_monthly", "pro_yearly"])
  })

  it("prices the free plan at USD 0 with 3 clientes / 5 proyectos features", () => {
    const free = getPlanCatalogEntry("free")
    expect(free.price).toBe("USD 0")
    expect(free.features).toEqual([
      "3 clientes",
      "5 proyectos",
      "Tareas y pagos ilimitados dentro de ellos",
    ])
  })

  it("prices pro_monthly at USD 12/mes with unlimited features (triangulation: different plan)", () => {
    const monthly = getPlanCatalogEntry("pro_monthly")
    expect(monthly.price).toBe("USD 12")
    expect(monthly.priceSuffix).toBe("/mes")
    expect(monthly.features).toContain("Clientes ilimitados")
    expect(monthly.badge).toBeUndefined()
  })

  it("prices pro_yearly at USD 120/año with a '2 meses gratis' badge and a monthly-equivalent note (triangulation)", () => {
    const yearly = getPlanCatalogEntry("pro_yearly")
    expect(yearly.price).toBe("USD 120")
    expect(yearly.priceSuffix).toBe("/año")
    expect(yearly.badge).toBe("2 meses gratis")
    expect(yearly.note).toBe("equivale a USD 10/mes")
  })

  it("throws for an unknown plan code", () => {
    // @ts-expect-error — exercising the runtime guard with an invalid code
    expect(() => getPlanCatalogEntry("enterprise")).toThrow(/Unknown plan code/)
  })
})
