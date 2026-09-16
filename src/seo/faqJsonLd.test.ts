import { describe, expect, it } from "vitest"
import { buildFaqJsonLd } from "./faqJsonLd"
import type { FaqItem } from "../content/faq"

describe("buildFaqJsonLd", () => {
  it("builds a schema.org FAQPage with one Question/acceptedAnswer per item", () => {
    const items: FaqItem[] = [
      { question: "¿Necesito tarjeta para empezar?", answer: "No." },
      { question: "¿Puedo cancelar cuando quiera?", answer: "Sí." },
    ]

    const result = buildFaqJsonLd(items)

    expect(result["@context"]).toBe("https://schema.org")
    expect(result["@type"]).toBe("FAQPage")
    expect(result.mainEntity).toHaveLength(2)
    expect(result.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "¿Necesito tarjeta para empezar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No.",
      },
    })
    expect(result.mainEntity[1].name).toBe("¿Puedo cancelar cuando quiera?")
  })

  it("returns an empty mainEntity array for an empty item list (triangulation)", () => {
    expect(buildFaqJsonLd([])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [],
    })
  })
})
