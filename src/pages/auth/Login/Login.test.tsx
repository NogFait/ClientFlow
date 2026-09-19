import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import Login from "./Login"

const signInWithPasswordMock = vi.fn()
const resendMock = vi.fn()

vi.mock("../../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args),
      resend: (...args: unknown[]) => resendMock(...args),
    },
  },
}))

function renderLogin() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">dashboard</div>} />
        <Route path="/register" element={<div data-testid="register-page">register</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  signInWithPasswordMock.mockReset()
  resendMock.mockReset()
})

async function submitLogin(user: ReturnType<typeof userEvent.setup>, email = "vos@tuestudio.com") {
  await user.type(screen.getByLabelText(/^Email$/i), email)
  await user.type(screen.getByLabelText(/^Contraseña$/i), "supersecreta")
  await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }))
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("Login", () => {
  it("has accessible Email and Contraseña fields and a 'Iniciar sesión' submit button", () => {
    renderLogin()

    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Iniciar sesión/i })).toBeInTheDocument()
  })

  it("links to /register for visitors without an account", () => {
    renderLogin()

    expect(screen.getByRole("link", { name: /Creala gratis/i })).toHaveAttribute("href", "/register")
  })

  it("links to /forgot-password next to the password field", () => {
    renderLogin()

    expect(screen.getByRole("link", { name: /Olvidaste tu contraseña/i })).toHaveAttribute("href", "/forgot-password")
  })

  it("submits email/password and navigates to /dashboard on success", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/^Email$/i), "vos@tuestudio.com")
    await user.type(screen.getByLabelText(/^Contraseña$/i), "supersecreta")
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }))

    await waitFor(() => expect(screen.getByTestId("dashboard-page")).toBeInTheDocument())
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "vos@tuestudio.com",
      password: "supersecreta",
    })
  })

  it("shows the server error message and does not navigate on failed login (triangulation)", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: "Credenciales inválidas" } })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/^Email$/i), "vos@tuestudio.com")
    await user.type(screen.getByLabelText(/^Contraseña$/i), "wrong")
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }))

    expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument()
  })

  it("explains in the user's language (not Supabase's English) that the account is not confirmed yet, and does not navigate", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { code: "email_not_confirmed", message: "Email not confirmed" } })
    const user = userEvent.setup()
    renderLogin()

    await submitLogin(user)

    expect(await screen.findByText(/Todavía no confirmaste tu email/i)).toBeInTheDocument()
    expect(screen.queryByText("Email not confirmed")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument()
  })

  it("offers to re-send the confirmation email to the address just typed, and confirms it", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { code: "email_not_confirmed", message: "Email not confirmed" } })
    resendMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderLogin()

    await submitLogin(user, "tita@estudio.com")
    await screen.findByText(/Todavía no confirmaste tu email/i)

    await user.click(screen.getByRole("button", { name: /Reenviar/i }))

    expect(await screen.findByText(/Listo, te lo reenviamos/i)).toBeInTheDocument()
    expect(resendMock).toHaveBeenCalledWith(expect.objectContaining({ type: "signup", email: "tita@estudio.com" }))
  })

  it("does not offer a resend for other login failures (triangulation: wrong password)", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { code: "invalid_credentials", message: "Invalid login credentials" } })
    const user = userEvent.setup()
    renderLogin()

    await submitLogin(user)

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Reenviar/i })).not.toBeInTheDocument()
  })

  it("toggles the password field between hidden and visible text when the reveal button is clicked", async () => {
    const user = userEvent.setup()
    renderLogin()

    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    expect(passwordInput).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: /Mostrar contraseña/i }))
    expect(passwordInput).toHaveAttribute("type", "text")
  })
})
