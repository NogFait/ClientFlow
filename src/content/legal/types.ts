export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalDocument {
  title: string
  lastUpdated: string
  sections: LegalSection[]
}
