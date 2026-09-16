const WORDS_PER_MINUTE = 200

// Estimated reading time from the raw Markdown body. Markdown syntax tokens
// (`##`, `-`, `**`) count as "words", which slightly inflates the estimate —
// acceptable for a "~3 min de lectura" hint and keeps the function trivial.
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter((token) => token.length > 0).length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
