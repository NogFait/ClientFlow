import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { PublicOnlyRoute } from "./PublicOnlyRoute"

const getUserMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: () => getUserMock(),
    },
  },
}))

function renderPublicOnly(initialPath: string) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard" element={<div data-testid="dashboard-page">dashboard</div>} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <div data-testid="login-page">login</div>
            </PublicOnlyRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe("PublicOnlyRoute", () => {
  it("shows the public page for an unauthenticated visitor", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })

    renderPublicOnly("/login")

    expect(await screen.findByTestId("login-page")).toBeInTheDocument()
  })

  it("redirects an already-authenticated visitor away to /dashboard (triangulation)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } })

    renderPublicOnly("/login")

    expect(await screen.findByTestId("dashboard-page")).toBeInTheDocument()
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument()
  })
})
