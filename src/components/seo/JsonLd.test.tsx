import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import JsonLd from "./JsonLd"

describe("JsonLd", () => {
  it("renders a script[type=application/ld+json] declaratively with the serialized data", () => {
    const { container, unmount } = render(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Thing" }} />,
    )

    // Declarative (in the React tree, not appended to <head> from an effect)
    // so the tag is part of the prerendered HTML and hydrates cleanly.
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    expect(JSON.parse(script!.textContent ?? "")).toEqual({ "@context": "https://schema.org", "@type": "Thing" })

    unmount()

    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull()
  })

  it("escapes '<' so content containing '</script>' cannot break out of the tag", () => {
    const { container } = render(<JsonLd data={{ text: "</script><img src=x onerror=alert(1)>" }} />)

    const script = container.querySelector('script[type="application/ld+json"]')!
    expect(script.innerHTML).not.toContain("</script>")
    expect(script.innerHTML).toContain("\\u003c")
    // Still valid JSON that round-trips to the original value.
    expect(JSON.parse(script.textContent ?? "")).toEqual({ text: "</script><img src=x onerror=alert(1)>" })
  })
})
