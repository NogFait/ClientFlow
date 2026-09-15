import type { PlanCode } from "../types"

// Single source of truth for plan pricing/features — shared by PlanCards,
// PlanBadge (name lookup) and the future public pricing page. Pure data, no
// side effects: keeps the catalog testable and trivially reusable.
export interface PlanCatalogEntry {
  code: PlanCode
  name: string
  price: string
  priceSuffix: string | null
  features: string[]
  badge?: string
  note?: string
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    code: "free",
    name: "Free",
    price: "USD 0",
    priceSuffix: null,
    features: ["3 clientes", "5 proyectos", "Tareas y pagos ilimitados dentro de ellos"],
  },
  {
    code: "pro_monthly",
    name: "Pro mensual",
    price: "USD 12",
    priceSuffix: "/mes",
    features: ["Clientes ilimitados", "Proyectos ilimitados", "Tareas y pagos ilimitados", "Soporte prioritario"],
  },
  {
    code: "pro_yearly",
    name: "Pro anual",
    price: "USD 120",
    priceSuffix: "/año",
    features: ["Clientes ilimitados", "Proyectos ilimitados", "Tareas y pagos ilimitados", "Soporte prioritario"],
    badge: "2 meses gratis",
    note: "equivale a USD 10/mes",
  },
]

export function getPlanCatalogEntry(code: PlanCode): PlanCatalogEntry {
  const entry = PLAN_CATALOG.find((candidate) => candidate.code === code)
  if (!entry) {
    throw new Error(`Unknown plan code: ${code}`)
  }
  return entry
}
