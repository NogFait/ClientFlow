// Minimal frontmatter parser for the blog's *.md files: a `---` fenced header
// of `key: value` lines followed by the Markdown body. Hand-rolled instead of
// gray-matter/js-yaml on purpose — the header is our own, tiny and flat, so
// a full YAML parser (and its bundle weight, since posts load in the client
// too) would be paying for features we never use. Supported values:
//   - strings, optionally wrapped in "double" or 'single' quotes
//   - the booleans true / false
//   - one-line lists: [a, b, c]
// Anything else (nested maps, multi-line strings) is intentionally out.

export type FrontmatterValue = string | boolean | string[]
export type Frontmatter = Record<string, FrontmatterValue>

export interface ParsedFrontmatter {
  data: Frontmatter
  body: string
}

const FENCE = "---"

function parseValue(raw: string): FrontmatterValue {
  const value = raw.trim()

  if (value === "true") return true
  if (value === "false") return false

  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim()
    if (inner === "") return []
    return inner.split(",").map((item) => stripQuotes(item.trim()))
  }

  return stripQuotes(value)
}

function stripQuotes(value: string): string {
  const quoted =
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
  return quoted ? value.slice(1, -1) : value
}

export function parseFrontmatter(raw: string): ParsedFrontmatter {
  // Normalise CRLF so a post saved on Windows parses identically.
  const lines = raw.replace(/\r\n/g, "\n").split("\n")

  if (lines[0] !== FENCE) {
    throw new Error("frontmatter: file must start with a '---' fence")
  }

  const closingIndex = lines.indexOf(FENCE, 1)
  if (closingIndex === -1) {
    throw new Error("frontmatter: missing closing '---' fence")
  }

  const data: Frontmatter = {}
  lines.slice(1, closingIndex).forEach((line, offset) => {
    const trimmed = line.trim()
    if (trimmed === "" || trimmed.startsWith("#")) return

    const separator = line.indexOf(":")
    if (separator === -1) {
      // +2: 1-based line numbers, and line 1 is the opening fence.
      throw new Error(`frontmatter: line ${offset + 2} is not a 'key: value' pair: ${JSON.stringify(line)}`)
    }

    const key = line.slice(0, separator).trim()
    data[key] = parseValue(line.slice(separator + 1))
  })

  return { data, body: lines.slice(closingIndex + 1).join("\n").replace(/^\n+/, "") }
}
