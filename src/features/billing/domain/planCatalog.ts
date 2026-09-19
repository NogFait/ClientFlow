import type { PlanCode } from "../types"
import { resources, type Resources } from "../../../i18n/resources"

// Single source of truth for plan pricing/features — shared by PlanCards,
// PlanBadge (name lookup), the public pricing page and the landing's
// pricing section. Pure data, no side effects: keeps the catalog testable
// and trivially reusable. Prices are language-neutral (USD either way);
// names, feature lines, badge and note come from
// src/i18n/locales/{es,en}/billing.json.
export interface PlanCatalogEntry {
  code: PlanCode
  name: string
  price: string
  priceSuffix: string | null
  features: string[]
  badge?: string
  note?: string
}

export type PlanStrings = Resources["billing"]["plans"]

export function buildPlanCatalog(strings: PlanStrings): PlanCatalogEntry[] {
  return [
    {
      code: "free",
      name: strings.free.name,
      price: "USD 0",
      priceSuffix: null,
      features: [...strings.free.features],
    },
    {
      code: "pro_monthly",
      name: strings.pro_monthly.name,
      price: "USD 12",
      priceSuffix: strings.pro_monthly.priceSuffix,
      features: [...strings.pro_monthly.features],
    },
    {
      code: "pro_yearly",
      name: strings.pro_yearly.name,
      price: "USD 120",
      priceSuffix: strings.pro_yearly.priceSuffix,
      features: [...strings.pro_yearly.features],
      badge: strings.pro_yearly.badge,
      note: strings.pro_yearly.note,
    },
  ]
}

export function findPlanCatalogEntry(catalog: PlanCatalogEntry[], code: PlanCode): PlanCatalogEntry {
  const entry = catalog.find((candidate) => candidate.code === code)
  if (!entry) {
    throw new Error(`Unknown plan code: ${code}`)
  }
  return entry
}

// Spanish catalog — the app's current language (batch B switches the
// authenticated UI to usePlanCatalog()).
export const PLAN_CATALOG: PlanCatalogEntry[] = buildPlanCatalog(resources.es.billing.plans)

export function getPlanCatalogEntry(code: PlanCode): PlanCatalogEntry {
  return findPlanCatalogEntry(PLAN_CATALOG, code)
}
