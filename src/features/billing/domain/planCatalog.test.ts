import { describe, expect, it } from "vitest"
import { PLAN_CATALOG, buildPlanCatalog, findPlanCatalogEntry, getPlanCatalogEntry } from "./planCatalog"
import { resources } from "../../../i18n/resources"

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

describe("buildPlanCatalog (localized)", () => {
  it("builds the English catalog with the same codes/prices and translated names/features", () => {
    const catalog = buildPlanCatalog(resources.en.billing.plans)

    expect(catalog.map((entry) => entry.code)).toEqual(PLAN_CATALOG.map((entry) => entry.code))
    expect(catalog.map((entry) => entry.price)).toEqual(PLAN_CATALOG.map((entry) => entry.price))
    expect(findPlanCatalogEntry(catalog, "pro_yearly")).toMatchObject({
      name: "Pro yearly",
      priceSuffix: "/year",
      badge: "2 months free",
      note: "equivalent to USD 10/month",
    })
    expect(findPlanCatalogEntry(catalog, "free").features).toEqual([
      "3 clients",
      "5 projects",
      "Unlimited tasks and payments within them",
    ])
  })

  it("keeps the Spanish constant equal to the catalog built from the Spanish strings (single source)", () => {
    expect(buildPlanCatalog(resources.es.billing.plans)).toEqual(PLAN_CATALOG)
  })
})
