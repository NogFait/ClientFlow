export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalDocument {
  title: string
  lastUpdated: string
  /** Shown above the document — the English courtesy-translation disclaimer. Absent in Spanish. */
  notice?: string
  sections: LegalSection[]
}
