import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import BlogIndexPage from "./BlogIndexPage"
import { renderWithLang } from "../../test/i18n"

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => ({ hasSession: false, loading: false }),
}))

// The blog's frame (intro, meta line, notes) follows the user's language;
// the posts themselves are the author's Spanish words and never change.
describe("BlogIndexPage — English chrome, Spanish posts", () => {
  it("translates the frame and dates, keeps post titles, and says posts are in Spanish", () => {
    renderWithLang(<BlogIndexPage />, "en", { initialEntries: ["/blog"] })

    expect(screen.getByText(/written in Spanish/i)).toBeInTheDocument()
    expect(screen.getAllByText(/min read/i).length).toBeGreaterThan(0)
    expect(screen.getByText("September 17, 2026")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Cobrar del exterior desde Argentina/i })).toBeInTheDocument()
  })

  it("stays fully Spanish in Spanish (triangulation)", () => {
    renderWithLang(<BlogIndexPage />, "es", { initialEntries: ["/blog"] })

    expect(screen.queryByText(/written in Spanish/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/min de lectura/i).length).toBeGreaterThan(0)
    expect(screen.getByText("17 de septiembre de 2026")).toBeInTheDocument()
  })
})
