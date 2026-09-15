import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import Register from "./Register"

const signUpMock = vi.fn()

vi.mock("../../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
    },
  },
}))

function renderRegister() {
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  signUpMock.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("Register", () => {
  it("has accessible Nombre, Email and Contraseña fields and a submit button", () => {
    renderRegister()

    expect(screen.getByLabelText(/^Nombre$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Creá tu cuenta|Registrarse/i })).toBeInTheDocument()
  })

  it("links back to /login for visitors who already have an account", () => {
    renderRegister()

    expect(screen.getByRole("link", { name: /Iniciar sesión/i })).toHaveAttribute("href", "/login")
  })

  it("submits name/email/password and navigates to /login on success (spec: register redirect → /login)", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText(/^Nombre$/i), "Tita")
    await user.type(screen.getByLabelText(/^Email$/i), "tita@estudio.com")
    await user.type(screen.getByLabelText(/^Contraseña$/i), "supersecreta")
    await user.click(screen.getByRole("button", { name: /Creá tu cuenta|Registrarse/i }))

    await waitFor(() => expect(screen.getByTestId("login-page")).toBeInTheDocument())
    expect(signUpMock).toHaveBeenCalledWith({ email: "tita@estudio.com", password: "supersecreta" })
  })

  it("shows a server error and does not navigate when signup fails (triangulation)", async () => {
    signUpMock.mockResolvedValue({ data: { user: null }, error: { message: "Ese email ya está en uso" } })
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText(/^Nombre$/i), "Tita")
    await user.type(screen.getByLabelText(/^Email$/i), "tita@estudio.com")
    await user.type(screen.getByLabelText(/^Contraseña$/i), "supersecreta")
    await user.click(screen.getByRole("button", { name: /Creá tu cuenta|Registrarse/i }))

    expect(await screen.findByText("Ese email ya está en uso")).toBeInTheDocument()
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument()
  })
})
