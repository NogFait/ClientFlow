import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { ProtectedRoute } from "./ProtectedRoute"

const getUserMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: () => getUserMock(),
    },
  },
}))

function renderProtected(initialPath: string) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div data-testid="dashboard-page">dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe("ProtectedRoute", () => {
  it("redirects an unauthenticated visitor from a protected route to /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })

    renderProtected("/dashboard")

    expect(await screen.findByTestId("login-page")).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument()
  })

  it("renders the protected content for an authenticated visitor (triangulation)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } })

    renderProtected("/dashboard")

    expect(await screen.findByTestId("dashboard-page")).toBeInTheDocument()
  })
})
