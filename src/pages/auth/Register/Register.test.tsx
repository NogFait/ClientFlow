import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import Register from "./Register"

const signUpMock = vi.fn()
const resendMock = vi.fn()

vi.mock("../../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
      resend: (...args: unknown[]) => resendMock(...args),
    },
  },
}))

function renderRegister(initialPath = "/register") {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Nombre$/i), "Tita")
  await user.type(screen.getByLabelText(/^Email$/i), "tita@estudio.com")
  await user.type(screen.getByLabelText(/^Contraseña$/i), "supersecreta")
  await user.click(screen.getByRole("button", { name: /Creá tu cuenta|Registrarse/i }))
}

beforeEach(() => {
  signUpMock.mockReset()
  resendMock.mockReset()
  sessionStorage.clear()
})

// With "Confirm email" ON in Supabase, a successful signup does not sign the
// user in: they must click the link we just emailed them. So the page stays
// put and tells them so, instead of bouncing to /login as it used to.
const CHECK_INBOX = /Revisá tu email/i

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
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

  it("submits name/email/password and, on success, replaces the form with a 'check your inbox' notice naming the address", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText(/^Nombre$/i), "Tita")
    await user.type(screen.getByLabelText(/^Email$/i), "tita@estudio.com")
    await user.type(screen.getByLabelText(/^Contraseña$/i), "supersecreta")
    await user.click(screen.getByRole("button", { name: /Creá tu cuenta|Registrarse/i }))

    expect(await screen.findByRole("heading", { name: CHECK_INBOX })).toBeInTheDocument()
    expect(screen.getByText(/tita@estudio\.com/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Contraseña$/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument()
    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: "tita@estudio.com", password: "supersecreta" }),
    )
  })

  it("keeps a way into the app from the notice: a link to /login", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const user = userEvent.setup()
    renderRegister()

    await fillAndSubmit(user)

    await screen.findByRole("heading", { name: CHECK_INBOX })
    expect(screen.getByRole("link", { name: /Iniciar sesión/i })).toHaveAttribute("href", "/login")
  })

  it("re-sends the confirmation email for that address from the notice and confirms it", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    resendMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderRegister()

    await fillAndSubmit(user)
    await screen.findByRole("heading", { name: CHECK_INBOX })

    await user.click(screen.getByRole("button", { name: /Reenviar/i }))

    expect(await screen.findByText(/Listo, te lo reenviamos/i)).toBeInTheDocument()
    expect(resendMock).toHaveBeenCalledWith(expect.objectContaining({ type: "signup", email: "tita@estudio.com" }))
  })

  it("surfaces Supabase's message when the resend is refused (triangulation: rate limit)", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    resendMock.mockResolvedValue({ error: { message: "For security purposes, you can only request this after 42 seconds." } })
    const user = userEvent.setup()
    renderRegister()

    await fillAndSubmit(user)
    await screen.findByRole("heading", { name: CHECK_INBOX })

    await user.click(screen.getByRole("button", { name: /Reenviar/i }))

    expect(await screen.findByText(/after 42 seconds/)).toBeInTheDocument()
    expect(screen.queryByText(/Listo, te lo reenviamos/i)).not.toBeInTheDocument()
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

describe("Register — pending plan (M3b: consume /register?plan=)", () => {
  it("persists a valid ?plan= param to sessionStorage after a successful signup", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const user = userEvent.setup()
    renderRegister("/register?plan=pro_monthly")

    await fillAndSubmit(user)

    await screen.findByRole("heading", { name: CHECK_INBOX })
    expect(sessionStorage.getItem("clientflow.pendingPlan")).toBe("pro_monthly")
  })

  it("persists pro_yearly too (triangulation: different plan)", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const user = userEvent.setup()
    renderRegister("/register?plan=pro_yearly")

    await fillAndSubmit(user)

    await screen.findByRole("heading", { name: CHECK_INBOX })
    expect(sessionStorage.getItem("clientflow.pendingPlan")).toBe("pro_yearly")
  })

  it("stores nothing when there is no ?plan= param (triangulation)", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const user = userEvent.setup()
    renderRegister("/register")

    await fillAndSubmit(user)

    await screen.findByRole("heading", { name: CHECK_INBOX })
    expect(sessionStorage.getItem("clientflow.pendingPlan")).toBeNull()
  })

  it("ignores an invalid ?plan= value silently", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const user = userEvent.setup()
    renderRegister("/register?plan=not-a-real-plan")

    await fillAndSubmit(user)

    await screen.findByRole("heading", { name: CHECK_INBOX })
    expect(sessionStorage.getItem("clientflow.pendingPlan")).toBeNull()
  })

  it("does not persist a plan when signup fails", async () => {
    signUpMock.mockResolvedValue({ data: { user: null }, error: { message: "Ese email ya está en uso" } })
    const user = userEvent.setup()
    renderRegister("/register?plan=pro_monthly")

    await fillAndSubmit(user)

    expect(await screen.findByText("Ese email ya está en uso")).toBeInTheDocument()
    expect(sessionStorage.getItem("clientflow.pendingPlan")).toBeNull()
  })
})
