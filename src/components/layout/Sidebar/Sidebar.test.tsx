import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

afterEach(() => {
  vi.doUnmock("../../../config/features")
  vi.resetModules()
})

async function renderSidebar() {
  const { default: Sidebar } = await import("./Sidebar")
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe("Sidebar — billing nav entry", () => {
  it("shows 'Plan y facturación' linking to /settings/billing when billing is enabled", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: true }))

    await renderSidebar()

    const link = screen.getByRole("link", { name: /Plan y facturación/i })
    expect(link).toHaveAttribute("href", "/settings/billing")
  })

  it("hides the billing nav entry when billing is disabled (triangulation)", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: false }))

    await renderSidebar()

    expect(screen.queryByRole("link", { name: /Plan y facturación/i })).not.toBeInTheDocument()
    // Pre-existing nav items are unaffected by the flag.
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument()
  })
})
