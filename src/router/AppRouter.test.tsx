import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import AppRouter from "./AppRouter"
import { renderWithLang } from "../test/i18n"

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

  it("renders the final terms page at /terms (operator named, no draft notice)", async () => {
    renderAt("/terms")

    expect(await screen.findByRole("heading", { name: /Términos de servicio/i })).toBeInTheDocument()
    expect(screen.getByText(/operado por Fausto Chirino/i)).toBeInTheDocument()
    expect(screen.queryByText(/Borrador/i)).not.toBeInTheDocument()
  })

  it("renders the final privacy page at /privacy (data-protection section, no draft notice)", async () => {
    renderAt("/privacy")

    expect(await screen.findByRole("heading", { name: /Política de privacidad/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Cómo protegemos tus datos/i })).toBeInTheDocument()
    expect(screen.queryByText(/Borrador/i)).not.toBeInTheDocument()
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

// English twins live under /en. The instance starts in Spanish here on
// purpose: it proves LocaleRoute switches the language from the URL, the
// same thing that happens on a client-side ES → EN navigation.
describe("AppRouter — English public surface (/en/*)", () => {
  it("renders the English landing at /en", async () => {
    renderWithLang(<AppRouter />, "es", { initialEntries: ["/en"] })

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Your clients, projects and payments. In one place.",
    )
  })

  it("renders the English pricing page at /en/pricing", async () => {
    renderWithLang(<AppRouter />, "es", { initialEntries: ["/en/pricing"] })

    expect(await screen.findByRole("heading", { name: /Start for free\. Pay when you grow\./i })).toBeInTheDocument()
  })

  it("renders the English terms and privacy pages at /en/terms and /en/privacy", async () => {
    const { unmount } = renderWithLang(<AppRouter />, "es", { initialEntries: ["/en/terms"] })
    expect(await screen.findByRole("heading", { name: "Terms of Service" })).toBeInTheDocument()
    unmount()

    renderWithLang(<AppRouter />, "es", { initialEntries: ["/en/privacy"] })
    expect(await screen.findByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument()
  })

  it("keeps the English chrome on the blog (posts stay Spanish, the frame follows the user)", async () => {
    renderWithLang(<AppRouter />, "en", { initialEntries: ["/blog"] })

    expect(await screen.findByRole("heading", { level: 1, name: "Blog" })).toBeInTheDocument()
    expect(await screen.findByRole("link", { name: /Log in/i })).toBeInTheDocument()
    expect(screen.getByText(/written in Spanish/i)).toBeInTheDocument()
    // Post content is the author's own words — Spanish title, untouched.
    expect(screen.getByRole("link", { name: /Cobrar del exterior desde Argentina/i })).toBeInTheDocument()
  })

  it("switches from / to /en client-side via the ES|EN control and back", async () => {
    const user = userEvent.setup()
    renderWithLang(<AppRouter />, "es", { initialEntries: ["/"] })
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Tus clientes, proyectos y cobros.")

    await user.click(screen.getAllByRole("button", { name: "English" })[0])
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Your clients, projects and payments.")

    await user.click(screen.getAllByRole("button", { name: "Español" })[0])
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Tus clientes, proyectos y cobros.")
  })

  it("has no /en/blog route", async () => {
    renderWithLang(<AppRouter />, "es", { initialEntries: ["/en/blog"] })

    expect(await screen.findByRole("link", { name: /Volver al inicio/i })).toBeInTheDocument()
  })
})
