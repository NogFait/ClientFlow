import { describe, expect, it } from "vitest"
import { applyHeadMeta, injectApp } from "./prerenderTemplate"
import { SITE_URL } from "../content/site"

// A trimmed stand-in for the built dist/index.html: same tag shapes Vite
// emits (multi-line <meta> with attributes on separate lines included).
const TEMPLATE = `<!doctype html>
<html lang="es">
  <head>
    <title>ClientFlow — CRM para freelancers</title>
    <meta
      name="description"
      content="Default description."
    />
    <link rel="canonical" href="${SITE_URL}/" />
    <meta property="og:title" content="ClientFlow — CRM para freelancers" />
    <meta property="og:description" content="Default description." />
    <meta property="og:url" content="${SITE_URL}/" />
    <meta property="og:image" content="${SITE_URL}/og-image.png" />
    <meta name="twitter:title" content="ClientFlow — CRM para freelancers" />
    <meta name="twitter:description" content="Default description." />
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`

describe("injectApp", () => {
  it("places the rendered markup inside the empty #root container", () => {
    const result = injectApp(TEMPLATE, "<h1>Hola</h1>")
    expect(result).toContain('<div id="root"><h1>Hola</h1></div>')
    // Nothing else in the template moves.
    expect(result).toContain('<script type="module" crossorigin src="/assets/index-abc.js"></script>')
  })

  it("throws when the template has no empty #root (guards against a silently broken build)", () => {
    expect(() => injectApp("<html><body></body></html>", "<h1>x</h1>")).toThrow(/#root/)
  })

  it("does not treat $-sequences in the app HTML as replacement patterns", () => {
    // String.prototype.replace interprets "$&" / "$1" in the replacement
    // string — the prices on the landing ("$ 600.000") would get mangled.
    const result = injectApp(TEMPLATE, "<p>$ 600.000 y $& y $1</p>")
    expect(result).toContain("<p>$ 600.000 y $& y $1</p>")
  })
})

describe("applyHeadMeta", () => {
  const meta = { path: "/pricing" as const, title: "Precios — ClientFlow", description: "Un solo plan pago." }

  it("rewrites title, description, canonical, og:* and twitter:* for the route", () => {
    const result = applyHeadMeta(TEMPLATE, meta)

    expect(result).toContain("<title>Precios — ClientFlow</title>")
    expect(result).toMatch(/<meta\s+name="description"\s+content="Un solo plan pago\."\s*\/>/)
    expect(result).toContain(`<link rel="canonical" href="${SITE_URL}/pricing" />`)
    expect(result).toContain('<meta property="og:title" content="Precios — ClientFlow" />')
    expect(result).toContain('<meta property="og:description" content="Un solo plan pago." />')
    expect(result).toContain(`<meta property="og:url" content="${SITE_URL}/pricing" />`)
    expect(result).toContain('<meta name="twitter:title" content="Precios — ClientFlow" />')
    expect(result).toContain('<meta name="twitter:description" content="Un solo plan pago." />')
    // Untouched tags survive verbatim.
    expect(result).toContain(`<meta property="og:image" content="${SITE_URL}/og-image.png" />`)
  })

  it("keeps the canonical/og:url for the root route as SITE_URL + '/' (no trailing-slash drift)", () => {
    const result = applyHeadMeta(TEMPLATE, { path: "/", title: "Home", description: "Desc" })
    expect(result).toContain(`<link rel="canonical" href="${SITE_URL}/" />`)
    expect(result).toContain(`<meta property="og:url" content="${SITE_URL}/" />`)
  })

  it("escapes HTML-significant characters in title and description", () => {
    const result = applyHeadMeta(TEMPLATE, {
      path: "/terms",
      title: 'A & B <"c">',
      description: "x < y & z",
    })
    expect(result).toContain("<title>A &amp; B &lt;&quot;c&quot;&gt;</title>")
    expect(result).toContain('content="x &lt; y &amp; z"')
    expect(result).not.toContain('<"c">')
  })

  it("throws when a tag it must rewrite is missing from the template", () => {
    const withoutCanonical = TEMPLATE.replace(/<link rel="canonical"[^>]*\/>/, "")
    expect(() => applyHeadMeta(withoutCanonical, meta)).toThrow(/canonical/)
  })
})
