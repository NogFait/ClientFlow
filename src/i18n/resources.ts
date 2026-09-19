import esCommon from "./locales/es/common.json"
import esLanding from "./locales/es/landing.json"
import esAuth from "./locales/es/auth.json"
import esLegal from "./locales/es/legal.json"
import esBilling from "./locales/es/billing.json"
import esApp from "./locales/es/app.json"
import enCommon from "./locales/en/common.json"
import enLanding from "./locales/en/landing.json"
import enAuth from "./locales/en/auth.json"
import enLegal from "./locales/en/legal.json"
import enBilling from "./locales/en/billing.json"
import enApp from "./locales/en/app.json"
import type { Lang } from "./index"

// Every translation is bundled statically — no HTTP backend, no lazy
// namespace loading. Two reasons: the prerender runs in Node with no server
// to fetch from, and a public page must never flash untranslated keys while
// a namespace downloads. The whole catalogue is a few KB gzipped.
//
// Spanish is the source of truth; `en` is typed against it so a key added
// to es/*.json without its English twin fails `tsc`, not a visitor.
export const NAMESPACES = ["common", "landing", "auth", "legal", "billing", "app"] as const
export type Namespace = (typeof NAMESPACES)[number]

export const DEFAULT_NS: Namespace = "common"

const es = {
  common: esCommon,
  landing: esLanding,
  auth: esAuth,
  legal: esLegal,
  billing: esBilling,
  app: esApp,
}

export type Resources = typeof es

const en: Resources = {
  common: enCommon,
  landing: enLanding,
  auth: enAuth,
  legal: enLegal,
  billing: enBilling,
  app: enApp,
}

export const resources: Record<Lang, Resources> = { es, en }
