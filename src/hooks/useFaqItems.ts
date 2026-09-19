import { useTranslation } from "react-i18next"
import { getFaqItems, type FaqItem } from "../content/faq"

export function useFaqItems(): FaqItem[] {
  const { t } = useTranslation("landing")
  return getFaqItems(t)
}
