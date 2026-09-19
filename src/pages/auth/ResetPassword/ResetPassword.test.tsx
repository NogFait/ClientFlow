import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import type { AuthState } from "../../../features/auth/context/authContext"
import ResetPassword from "./ResetPassword"

const updateUserMock = vi.fn()

vi.mock("../../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      updateUser: (...args: unknown[]) => updateUserMock(...args),
    },
  },
}))

// The page reads the app-wide auth state: the recovery link from the email
// gives the visitor a session (implicit flow), so "authenticated" is the
// normal case here and "anonymous" means the link was bad or expired.
let authState: AuthState
vi.mock("../../../features/auth/context/authContext", () => ({
  useAuthState: () => authState,
}))

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/reset-password"]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const authenticated = (): AuthState =>
  ({ status: "authenticated", session: {} as AuthState["session"], user: { id: "u1" } as AuthState["user"] })

async function fill(user: ReturnType<typeof userEvent.setup>, password: string, confirm = password) {
  await user.type(screen.getByLabelText(/^Nueva contraseña$/i), password)
  await user.type(screen.getByLabelText(/^Repetí la contraseña$/i), confirm)
  await user.click(screen.getByRole("button", { name: /Guardar contraseña/i }))
}

beforeEach(() => {
  updateUserMock.mockReset()
  authState = authenticated()
})
afterEach(() => vi.clearAllMocks())

describe("ResetPassword — with the recovery session from the email link", () => {
  it("has accessible new-password and confirmation fields and a submit button", () => {
    renderPage()

    expect(screen.getByRole("heading", { name: /Elegí una contraseña nueva/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nueva contraseña$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Repetí la contraseña$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Guardar contraseña/i })).toBeInTheDocument()
  })

  it("saves the new password and moves the (already signed-in) user on to /dashboard", async () => {
    updateUserMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderPage()

    await fill(user, "n3w-secret-pw")

    await waitFor(() => expect(screen.getByTestId("dashboard-page")).toBeInTheDocument())
    expect(updateUserMock).toHaveBeenCalledWith({ password: "n3w-secret-pw" })
  })

  it("refuses a password shorter than 8 characters before calling Supabase", async () => {
    const user = userEvent.setup()
    renderPage()

    await fill(user, "short")

    expect(await screen.findByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    expect(updateUserMock).not.toHaveBeenCalled()
  })

  it("refuses when the two passwords differ before calling Supabase (triangulation)", async () => {
    const user = userEvent.setup()
    renderPage()

    await fill(user, "n3w-secret-pw", "n3w-secret-pX")

    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument()
    expect(updateUserMock).not.toHaveBeenCalled()
  })

  it("shows Supabase's message and stays put when the update is refused", async () => {
    updateUserMock.mockResolvedValue({ error: { message: "New password should be different from the old password." } })
    const user = userEvent.setup()
    renderPage()

    await fill(user, "n3w-secret-pw")

    expect(await screen.findByText(/different from the old password/)).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument()
  })
})

describe("ResetPassword — without a session (bad or expired link)", () => {
  it("renders nothing while the auth state is still loading", () => {
    authState = { status: "loading", session: null, user: null }
    renderPage()

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument()
  })

  it("explains the link is invalid or expired and offers to request a new one instead of showing the form", () => {
    authState = { status: "anonymous", session: null, user: null }
    renderPage()

    expect(screen.getByRole("heading", { name: /link (no es válido|venció)/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Nueva contraseña$/i)).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Pedir un link nuevo/i })).toHaveAttribute("href", "/forgot-password")
  })
})
