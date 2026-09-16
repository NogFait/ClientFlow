export interface BlogPost {
  /** URL segment and filename (without .md), kebab-case. */
  slug: string
  title: string
  /** Meta description / card summary, ≤160 chars. */
  description: string
  /** Publication date, YYYY-MM-DD. */
  date: string
  author: string
  /** Drafts are excluded from the index, the sitemap and the prerender. */
  draft: boolean
  tags: string[]
  /** Markdown source (frontmatter stripped). */
  body: string
  /** Body rendered to HTML at load time — identical on server and client. */
  html: string
  readingMinutes: number
}
