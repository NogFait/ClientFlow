import type { TFunction } from "i18next"
import type { LegalDocument } from "./types"
import { CONTACT_EMAIL } from "../contact"

export type LegalKind = "terms" | "privacy"

// Plain-language terms and privacy policy, one JSON document per language
// in src/i18n/locales/{es,en}/legal.json. Every statement describes what the
// product actually does today (verified against the codebase); no
// compliance claims (GDPR/ISO/etc.) are made because none have been
// certified. The privacy "Cómo protegemos tus datos" section mirrors the
// security audit of 2026-09-16 (RLS, TLS, headers) — update it if that
// changes. A lawyer's review is still recommended before scaling — keep the
// text honest rather than impressive.
//
// Spanish is the binding text; the English JSON carries a "notice" saying
// so, which the Spanish one leaves empty (→ omitted here).
export function getLegalDocument(kind: LegalKind, t: TFunction<"legal">): LegalDocument {
  const document = t(kind, { returnObjects: true, contactEmail: CONTACT_EMAIL })
  const notice = t("notice")
  return notice ? { ...document, notice } : document
}
