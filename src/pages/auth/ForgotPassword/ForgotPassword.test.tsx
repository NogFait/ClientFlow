import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import ForgotPassword from "./ForgotPassword"

const resetPasswordForEmailMock = vi.fn()

vi.mock("../../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmailMock(...args),
    },
  },
}))

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function submit(user: ReturnType<typeof userEvent.setup>, email = "tita@estudio.com") {
  await user.type(screen.getByLabelText(/^Email$/i), email)
  await user.click(screen.getByRole("button", { name: /Enviarme el link/i }))
}

beforeEach(() => resetPasswordForEmailMock.mockReset())
afterEach(() => vi.clearAllMocks())

describe("ForgotPassword", () => {
  it("has an accessible Email field, a submit button and a way back to /login", () => {
    renderPage()

    expect(screen.getByRole("heading", { name: /Recuperá tu contraseña/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Enviarme el link/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Volver a iniciar sesión/i })).toHaveAttribute("href", "/login")
  })

  it("requests the recovery email and confirms it without revealing whether the account exists", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(await screen.findByText(/Si existe una cuenta/i)).toBeInTheDocument()
    expect(screen.getByText(/tita@estudio\.com/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Email$/i)).not.toBeInTheDocument()
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("tita@estudio.com", expect.anything())
  })

  it("shows Supabase's refusal and keeps the form (triangulation: rate limit)", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      error: { message: "For security purposes, you can only request this after 42 seconds." },
    })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(await screen.findByText(/after 42 seconds/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument()
    expect(screen.queryByText(/Si existe una cuenta/i)).not.toBeInTheDocument()
  })
})
