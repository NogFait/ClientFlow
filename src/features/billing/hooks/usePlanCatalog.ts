import { useTranslation } from "react-i18next"
import { buildPlanCatalog, type PlanCatalogEntry } from "../domain/planCatalog"

// PLAN_CATALOG in the tree's current language. Same shape as the Spanish
// constant, so PricingSection/PricingToggleCards render exactly as before.
export function usePlanCatalog(): PlanCatalogEntry[] {
  const { t } = useTranslation("billing")
  return buildPlanCatalog(t("plans", { returnObjects: true }))
}
