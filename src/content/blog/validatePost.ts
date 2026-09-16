import type { Frontmatter } from "./parseFrontmatter"
import { ISO_DATE_PATTERN } from "./formatDateEs"

export const DESCRIPTION_MAX_LENGTH = 160

// Lowercase words separated by single dashes: the slug is the filename AND
// the public URL segment, so it must be safe to type and to index.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface PostCandidate {
  slug: string
  data: Frontmatter
  body: string
}

// Returns a list of human-readable problems (empty = valid). Run at load time
// for every post, so a typo in the frontmatter fails the test suite (and the
// build) instead of shipping a post with an empty title or a broken URL.
export function validatePost({ slug, data, body }: PostCandidate): string[] {
  const errors: string[] = []

  if (!SLUG_PATTERN.test(slug)) {
    errors.push(`slug ${JSON.stringify(slug)} must be kebab-case (lowercase letters, digits and single dashes)`)
  }

  const { title, description, date, draft, tags } = data

  if (typeof title !== "string" || title.trim() === "") {
    errors.push("title is required")
  }

  if (typeof description !== "string" || description.trim() === "") {
    errors.push("description is required")
  } else if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`description must be at most ${DESCRIPTION_MAX_LENGTH} characters (got ${description.length})`)
  }

  if (typeof date !== "string" || !ISO_DATE_PATTERN.test(date)) {
    errors.push("date is required and must be YYYY-MM-DD")
  }

  if (draft !== undefined && typeof draft !== "boolean") {
    errors.push("draft must be true or false")
  }

  if (tags !== undefined && !Array.isArray(tags)) {
    errors.push("tags must be an inline list like [a, b]")
  }

  if (hasLevelOneHeading(body)) {
    errors.push("body must not contain a '# ' level-1 heading — the page renders the <h1>; start at '## '")
  }

  // marked keeps raw HTML as-is (no sanitiser: posts are our own files). A
  // <script> would be injected verbatim into every visitor's page, so make
  // it impossible to ship one by accident.
  if (/<script\b/i.test(body)) {
    errors.push("body must not contain a <script> tag")
  }

  return errors
}

// A "# " at the start of a line is an <h1> in Markdown, except inside a fenced
// code block (```), where it is usually a shell comment.
function hasLevelOneHeading(body: string): boolean {
  let inFence = false
  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (!inFence && /^# /.test(line)) return true
  }
  return false
}
