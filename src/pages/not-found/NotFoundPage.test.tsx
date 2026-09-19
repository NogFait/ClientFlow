import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import NotFoundPage from "./NotFoundPage"
import { renderWithLang } from "../../test/i18n"

// A user who chose English must not be bounced back to the Spanish home by
// a "back to home" link with a hardcoded "/".
describe("NotFoundPage — back link keeps the chosen language", () => {
  it("links to /en in English", () => {
    renderWithLang(<NotFoundPage />, "en", { initialEntries: ["/nope"] })
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/en")
  })

  it("links to / in Spanish (triangulation)", () => {
    renderWithLang(<NotFoundPage />, "es", { initialEntries: ["/nope"] })
    expect(screen.getByRole("link", { name: /volver al inicio/i })).toHaveAttribute("href", "/")
  })
})
