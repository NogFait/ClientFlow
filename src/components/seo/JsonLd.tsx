interface JsonLdProps {
  data: object
}

// "<" is escaped as < so a value containing "</script>" can never close
// the tag early (JSON.parse reads < back as "<", so the payload is
// unchanged for consumers).
function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c")
}

// Declarative <script type="application/ld+json"> rendered in place (inside
// the React tree, not appended to <head> from an effect) so structured data
// is part of the prerendered HTML crawlers receive and hydrates cleanly.
// Google reads JSON-LD from <body> just as well as from <head>.
const JsonLd = ({ data }: JsonLdProps) => {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}

export default JsonLd
