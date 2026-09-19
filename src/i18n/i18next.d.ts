import "i18next"
import type { Resources } from "./resources"

// Typed keys: `t("nav.login")` is checked against es/common.json at compile
// time, and `t("faq.items", { returnObjects: true })` comes back as the
// array shape declared in the JSON instead of `string | object`.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: Resources
  }
}
