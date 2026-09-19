import type { TFunction } from "i18next"
import { resources } from "../i18n/resources"

export interface FaqItem {
  question: string
  answer: string
}

// Shared FAQ copy — landing page's #faq section and the dedicated /pricing
// page render the same accordion from this single source. The text lives in
// src/i18n/locales/{es,en}/landing.json under "faq.items" (design source:
// scratchpad design/Main.dc.html — questions only; answers 2-4 authored to
// match the product's real Free-limit/cancellation/currency behavior; the
// first sets the "CRM" expectation straight — the audit's positioning note).
export function getFaqItems(t: TFunction<"landing">): FaqItem[] {
  return t("faq.items", { returnObjects: true })
}

// Spanish list, for callers outside React (structured-data tests, scripts).
export const FAQ_ITEMS: FaqItem[] = resources.es.landing.faq.items
