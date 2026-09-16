import { Marked } from "marked"

// One configured instance (not the global `marked` singleton) so nothing else
// in the bundle can mutate our options. gfm for tables/strikethrough/autolinks;
// everything else stays at marked's defaults — no heading ids, no mangling,
// no sanitiser: posts are our own repo files, reviewed like code.
const renderer = new Marked({ gfm: true })

// Runs at module load in BOTH the SSR bundle (prerender) and the browser, so
// the HTML string React injects is byte-identical on both sides and
// hydration never sees a mismatch. Synchronous on purpose (`async: false`):
// posts are loaded eagerly and pages must be able to render without a
// Suspense hop.
export function renderMarkdown(markdown: string): string {
  return renderer.parse(markdown, { async: false })
}
