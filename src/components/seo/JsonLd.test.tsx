import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import JsonLd from "./JsonLd"

describe("JsonLd", () => {
  it("injects a script[type=application/ld+json] with the serialized data on mount", () => {
    const { unmount } = render(<JsonLd data={{ "@context": "https://schema.org", "@type": "Thing" }} />)

    const script = document.head.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    expect(JSON.parse(script!.textContent ?? "")).toEqual({ "@context": "https://schema.org", "@type": "Thing" })

    unmount()

    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull()
  })
})
