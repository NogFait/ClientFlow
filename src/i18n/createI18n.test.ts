import { describe, expect, it } from "vitest"
import { createI18n } from "./createI18n"

describe("createI18n", () => {
  it("returns an initialized instance in the requested language with every namespace loaded synchronously", () => {
    const i18n = createI18n("en")

    expect(i18n.isInitialized).toBe(true)
    expect(i18n.language).toBe("en")
    expect(i18n.t("nav.login")).toBe("Log in")
    expect(i18n.t("hero.title", { ns: "landing" })).toBe("Your clients, projects and payments. In one place.")
  })

  it("keeps Spanish as the default namespace copy (triangulation: other language)", () => {
    const i18n = createI18n("es")

    expect(i18n.language).toBe("es")
    expect(i18n.t("nav.login")).toBe("Iniciar sesión")
  })

  it("returns independent instances — changing one never leaks into another (per-render prerender safety)", () => {
    const a = createI18n("es")
    const b = createI18n("en")

    void a.changeLanguage("en")

    expect(a.language).toBe("en")
    expect(b.language).toBe("en")
    expect(createI18n("es").language).toBe("es")
  })

  it("falls back to Spanish for a key missing in English rather than showing the raw key", () => {
    const i18n = createI18n("en")
    i18n.addResource("es", "common", "onlyInSpanish", "solo en español")

    expect(i18n.t("onlyInSpanish" as never)).toBe("solo en español")
  })

  it("does not HTML-escape interpolated values (React escapes on render already)", () => {
    const i18n = createI18n("es")
    i18n.addResource("es", "common", "greet", "Hola {{name}}")

    expect(i18n.t("greet" as never, { name: "<b>" })).toBe("Hola <b>")
  })

  it("interpolates inside objects returned with returnObjects (legal documents rely on it)", () => {
    const i18n = createI18n("es")
    const terms = i18n.t("terms", { ns: "legal", returnObjects: true, contactEmail: "x@y.z" })
    const deletion = terms.sections.find((section) => section.heading === "Eliminación de cuenta")

    expect(deletion?.paragraphs[0]).toContain("x@y.z")
    expect(deletion?.paragraphs[0]).not.toContain("{{contactEmail}}")
  })
})
