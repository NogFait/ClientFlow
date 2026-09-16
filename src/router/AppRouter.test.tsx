import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import AppRouter from "./AppRouter"

// AppRouter itself renders below AuthProvider in the real app (App.tsx) —
// here every route is exercised as an anonymous visitor, so the context is
// mocked directly rather than requiring a real AuthProvider + supabase mock.
vi.mock("../features/auth/context/authContext", () => ({
  useAuthState: () => ({ session: null, user: null, status: "anonymous" }),
}))

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>,
  )
}

describe("AppRouter — public surface (M3)", () => {
  it("renders the landing page at /", async () => {
    renderAt("/")

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Tus clientes, proyectos y cobros. En un solo lugar.",
    )
  })

  it("renders the pricing page at /pricing", async () => {
    renderAt("/pricing")

    expect(await screen.findByRole("heading", { name: /Empezá gratis\. Pagá cuando crezcas\./i })).toBeInTheDocument()
  })

  it("renders the terms page at /terms with the draft notice", async () => {
    renderAt("/terms")

    expect(await screen.findByRole("heading", { name: /Términos de servicio/i })).toBeInTheDocument()
    expect(screen.getByText(/Borrador — pendiente de revisión legal/i)).toBeInTheDocument()
  })

  it("renders the privacy page at /privacy with the draft notice", async () => {
    renderAt("/privacy")

    expect(await screen.findByRole("heading", { name: /Política de privacidad/i })).toBeInTheDocument()
    expect(screen.getByText(/Borrador — pendiente de revisión legal/i)).toBeInTheDocument()
  })

  it("renders the login form at /login for an anonymous visitor", async () => {
    renderAt("/login")

    expect(await screen.findByRole("heading", { name: /Bienvenido de nuevo/i })).toBeInTheDocument()
  })

  it("renders the register form at /register for an anonymous visitor", async () => {
    renderAt("/register")

    expect(await screen.findByRole("heading", { name: /Creá tu cuenta/i })).toBeInTheDocument()
  })

  it("redirects an unauthenticated visitor away from a protected route to the login page (guard behavior)", async () => {
    renderAt("/dashboard")

    expect(await screen.findByRole("heading", { name: /Bienvenido de nuevo/i })).toBeInTheDocument()
  })

  it("renders NotFoundPage for an unknown route, with a link back to the landing page", async () => {
    renderAt("/this-route-does-not-exist")

    expect(await screen.findByRole("link", { name: /Volver al inicio/i })).toHaveAttribute("href", "/")
  })
})
