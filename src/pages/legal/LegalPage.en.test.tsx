import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { renderWithLang } from "../../test/i18n"
import TermsPage from "./TermsPage"
import PrivacyPage from "./PrivacyPage"

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => ({ hasSession: false, loading: false }),
}))

describe("Legal pages — English (/en/terms, /en/privacy)", () => {
  it("renders the English terms with the courtesy-translation notice and the English title", () => {
    renderWithLang(<TermsPage />, "en", { initialEntries: ["/en/terms"] })

    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument()
    expect(screen.getByText("This is a courtesy translation. The Spanish version prevails.")).toBeInTheDocument()
    expect(screen.getByText(/Last updated: September 2026/)).toBeInTheDocument()
    expect(screen.getByText(/operated by Fausto Chirino/i)).toBeInTheDocument()
    expect(document.title).toBe("Terms of Service — ClientFlow")
  })

  it("renders the English privacy policy and localizes the footer legal links (triangulation)", () => {
    renderWithLang(<PrivacyPage />, "en", { initialEntries: ["/en/privacy"] })

    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "How we protect your data" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/en/terms")
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/en/privacy")
    const blogLinks = screen.getAllByRole("link", { name: "Blog (es)" })
    expect(blogLinks).toHaveLength(2) // nav + footer
    blogLinks.forEach((link) => expect(link).toHaveAttribute("href", "/blog"))
  })

  it("shows no notice in Spanish (the binding text needs none)", () => {
    renderWithLang(<TermsPage />, "es", { initialEntries: ["/terms"] })

    expect(screen.queryByText(/courtesy translation/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Última actualización: Septiembre de 2026/)).toBeInTheDocument()
  })
})
