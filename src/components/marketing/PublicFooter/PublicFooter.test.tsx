import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import PublicFooter from "./PublicFooter"

describe("PublicFooter", () => {
  it("links to /terms and /privacy", () => {
    render(
      <MemoryRouter>
        <PublicFooter />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: /Términos/i })).toHaveAttribute("href", "/terms")
    expect(screen.getByRole("link", { name: /Privacidad/i })).toHaveAttribute("href", "/privacy")
  })
})
