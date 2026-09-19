import { describe, expect, it } from "vitest"
import { createI18n } from "../../i18n/createI18n"
import { getLegalDocument } from "./documents"
import { CONTACT_EMAIL } from "../contact"

const es = createI18n("es").getFixedT(null, "legal")
const en = createI18n("en").getFixedT(null, "legal")

describe("getLegalDocument", () => {
  it("returns the final Spanish terms — operator named, contact email interpolated, no notice", () => {
    const terms = getLegalDocument("terms", es)

    expect(terms.title).toBe("Términos de servicio")
    expect(terms.lastUpdated).toBe("Septiembre de 2026")
    expect(terms.notice).toBeUndefined()
    expect(terms.sections[0].paragraphs[0]).toContain("operado por Fausto Chirino")
    expect(terms.sections.find((s) => s.heading === "Eliminación de cuenta")?.paragraphs[0]).toContain(CONTACT_EMAIL)
    expect(JSON.stringify(terms)).not.toContain("{{")
  })

  it("returns the Spanish privacy policy with the data-protection section (triangulation: other document)", () => {
    const privacy = getLegalDocument("privacy", es)

    expect(privacy.title).toBe("Política de privacidad")
    expect(privacy.sections.map((s) => s.heading)).toContain("Cómo protegemos tus datos")
    expect(privacy.sections.find((s) => s.heading === "Tus derechos")?.paragraphs[0]).toContain(CONTACT_EMAIL)
  })

  it("returns the English courtesy translation with the 'Spanish version prevails' notice and the same structure", () => {
    const terms = getLegalDocument("terms", en)
    const termsEs = getLegalDocument("terms", es)

    expect(terms.title).toBe("Terms of Service")
    expect(terms.notice).toBe("This is a courtesy translation. The Spanish version prevails.")
    expect(terms.sections).toHaveLength(termsEs.sections.length)
    terms.sections.forEach((section, index) => {
      expect(section.paragraphs).toHaveLength(termsEs.sections[index].paragraphs.length)
    })
    expect(terms.sections.find((s) => s.heading === "Account deletion")?.paragraphs[0]).toContain(CONTACT_EMAIL)
  })

  it("English privacy policy mirrors the Spanish section count and carries the notice (triangulation)", () => {
    const privacy = getLegalDocument("privacy", en)

    expect(privacy.notice).toBeTruthy()
    expect(privacy.sections).toHaveLength(getLegalDocument("privacy", es).sections.length)
    expect(JSON.stringify(privacy)).not.toContain("{{")
  })
})
