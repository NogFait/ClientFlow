import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { PublicOnlyRoute } from "./PublicOnlyRoute"
import type { AuthState } from "../../features/auth/context/authContext"

let authState: AuthState

vi.mock("../../features/auth/context/authContext", () => ({
  useAuthState: () => authState,
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

afterEach(() => {
  vi.clearAllMocks()
})

describe("PublicOnlyRoute", () => {
  it("renders nothing while auth status is loading", () => {
    authState = { session: null, user: null, status: "loading" }

    renderPublicOnly("/login")

    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument()
  })

  it("shows the public page for an anonymous visitor", () => {
    authState = { session: null, user: null, status: "anonymous" }

    renderPublicOnly("/login")

    expect(screen.getByTestId("login-page")).toBeInTheDocument()
  })

  it("redirects an already-authenticated visitor away to /dashboard (triangulation)", () => {
    authState = { session: null, user: { id: "user-1" } as never, status: "authenticated" }

    renderPublicOnly("/login")

    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument()
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument()
  })
})
