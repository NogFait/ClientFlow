import type { FaqItem } from "../content/faq"

interface FaqJsonLdQuestion {
  "@type": "Question"
  name: string
  acceptedAnswer: {
    "@type": "Answer"
    text: string
  }
}

export interface FaqJsonLd {
  "@context": "https://schema.org"
  "@type": "FAQPage"
  mainEntity: FaqJsonLdQuestion[]
}

// Pure builder — schema.org FAQPage structured data from the same FAQ_ITEMS
// content already rendered on-page, so the JSON-LD can never drift from
// what a visitor actually sees.
export function buildFaqJsonLd(items: FaqItem[]): FaqJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}
