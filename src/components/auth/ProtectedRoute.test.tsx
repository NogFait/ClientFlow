import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import type { AuthState } from "../../features/auth/context/authContext"

let authState: AuthState

vi.mock("../../features/auth/context/authContext", () => ({
  useAuthState: () => authState,
}))

const readPendingPlanMock = vi.fn()
const clearPendingPlanMock = vi.fn()

vi.mock("../../features/auth/pendingPlan", () => ({
  readPendingPlan: () => readPendingPlanMock(),
  clearPendingPlan: () => clearPendingPlanMock(),
}))

async function renderProtected(initialPath: string) {
  const { ProtectedRoute } = await import("./ProtectedRoute")
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
        <Route path="/settings/billing" element={<div data-testid="billing-page">billing</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div data-testid="dashboard-page">dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  readPendingPlanMock.mockReset().mockReturnValue(null)
  clearPendingPlanMock.mockReset()
  vi.doMock("../../config/features", () => ({ BILLING_ENABLED: true }))
})

afterEach(() => {
  vi.doUnmock("../../config/features")
  vi.resetModules()
  vi.clearAllMocks()
})

describe("ProtectedRoute", () => {
  it("renders nothing while auth status is loading", async () => {
    authState = { session: null, user: null, status: "loading" }

    await renderProtected("/dashboard")

    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument()
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument()
  })

  it("redirects an anonymous visitor from a protected route to /login", async () => {
    authState = { session: null, user: null, status: "anonymous" }

    await renderProtected("/dashboard")

    expect(screen.getByTestId("login-page")).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument()
  })

  it("renders the protected content for an authenticated visitor (triangulation)", async () => {
    authState = { session: null, user: { id: "user-1" } as never, status: "authenticated" }

    await renderProtected("/dashboard")

    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument()
  })

  it("redirects to /settings/billing?plan=<code> once, when a pending plan is stored (M3b: consume /register?plan=)", async () => {
    authState = { session: null, user: { id: "user-1" } as never, status: "authenticated" }
    readPendingPlanMock.mockReturnValue("pro_monthly")

    await renderProtected("/dashboard")

    expect(await screen.findByTestId("billing-page")).toBeInTheDocument()
    expect(clearPendingPlanMock).toHaveBeenCalledTimes(1)
  })

  it("does not redirect when there is no pending plan (triangulation)", async () => {
    authState = { session: null, user: { id: "user-1" } as never, status: "authenticated" }
    readPendingPlanMock.mockReturnValue(null)

    await renderProtected("/dashboard")

    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument()
    expect(clearPendingPlanMock).not.toHaveBeenCalled()
  })

  it("ignores a pending plan silently when billing is disabled", async () => {
    vi.doMock("../../config/features", () => ({ BILLING_ENABLED: false }))
    authState = { session: null, user: { id: "user-1" } as never, status: "authenticated" }
    readPendingPlanMock.mockReturnValue("pro_monthly")

    await renderProtected("/dashboard")

    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument()
    expect(readPendingPlanMock).not.toHaveBeenCalled()
    expect(clearPendingPlanMock).not.toHaveBeenCalled()
  })
})
