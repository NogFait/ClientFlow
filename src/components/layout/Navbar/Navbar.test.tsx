import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import type { Entitlements } from "../../../features/billing/types"
import type { AuthState } from "../../../features/auth/context/authContext"

const signOutMock = vi.fn()

vi.mock("../../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signOut: () => signOutMock(),
    },
  },
}))

let authState: AuthState

vi.mock("../../../features/auth/context/authContext", () => ({
  useAuthState: () => authState,
}))

let entitlementsContextValue: { entitlements: Entitlements | null; loading: boolean; refresh: () => Promise<void> }

vi.mock("../../../features/billing/context/entitlementsContext", () => ({
  useEntitlementsContext: () => entitlementsContextValue,
}))

const freeEntitlements: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 1, proyectos: 0 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

const proYearlyEntitlements: Entitlements = { ...freeEntitlements, plan: "pro_yearly", status: "active" }

async function renderNavbar(props: { onOpenMobileNav?: () => void; mobileNavOpen?: boolean } = {}) {
  const { default: Navbar } = await import("./Navbar")
  render(
    <MemoryRouter>
      <Navbar {...props} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  authState = { session: null, user: null, status: "anonymous" }
  entitlementsContextValue = { entitlements: freeEntitlements, loading: false, refresh: vi.fn() }
})

afterEach(() => {
  vi.doUnmock("../../../config/features")
  vi.resetModules()
})

describe("Navbar — plan badge", () => {
  it("shows the plan badge linking to /settings/billing when billing is enabled and entitlements are loaded", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: true }))

    await renderNavbar()

    const link = await screen.findByRole("link", { name: /Free/i })
    expect(link).toHaveAttribute("href", "/settings/billing")
  })

  it("shows 'Pro anual' for a pro_yearly plan (triangulation: different plan)", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: true }))
    entitlementsContextValue = { entitlements: proYearlyEntitlements, loading: false, refresh: vi.fn() }

    await renderNavbar()

    expect(await screen.findByText("Pro anual")).toBeInTheDocument()
  })

  it("does not render the badge when billing is disabled", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: false }))

    await renderNavbar()

    expect(screen.queryByRole("link", { name: /Free/i })).not.toBeInTheDocument()
  })

  it("does not render the badge while entitlements are still loading (triangulation)", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: true }))
    entitlementsContextValue = { entitlements: null, loading: true, refresh: vi.fn() }

    await renderNavbar()

    expect(screen.queryByRole("link", { name: /Free/i })).not.toBeInTheDocument()
  })
})

describe("Navbar — user info from AuthProvider context", () => {
  beforeEach(() => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: false }))
  })

  it("shows the user's name from context and its initial as the avatar (M3b: no more per-guard getUser())", async () => {
    authState = {
      session: null,
      user: { id: "user-1", user_metadata: { name: "Fausto" } } as never,
      status: "authenticated",
    }

    await renderNavbar()

    expect(screen.getByText("Fausto")).toBeInTheDocument()
    expect(screen.getByText("F")).toBeInTheDocument()
  })

  it("falls back to 'Usuario' when there is no name in user_metadata (triangulation)", async () => {
    authState = { session: null, user: { id: "user-1", user_metadata: {} } as never, status: "authenticated" }

    await renderNavbar()

    expect(screen.getByText("Usuario")).toBeInTheDocument()
    expect(screen.getByText("U")).toBeInTheDocument()
  })

  it("calls signOut and navigates to /login on logout click, without a manual getUser() re-fetch", async () => {
    authState = { session: null, user: { id: "user-1", user_metadata: { name: "Tita" } } as never, status: "authenticated" }
    signOutMock.mockResolvedValue(undefined)

    await renderNavbar()
    screen.getByRole("button", { name: /Salir/i }).click()

    expect(signOutMock).toHaveBeenCalledTimes(1)
  })
})

describe("Navbar — mobile menu toggle", () => {
  beforeEach(() => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: false }))
  })

  it("renders a closed hamburger button by default and calls onOpenMobileNav when clicked", async () => {
    const onOpenMobileNav = vi.fn()
    await renderNavbar({ onOpenMobileNav })

    const button = screen.getByRole("button", { name: /Abrir menú/i })
    expect(button).toHaveAttribute("aria-expanded", "false")

    button.click()
    expect(onOpenMobileNav).toHaveBeenCalledTimes(1)
  })

  it("reflects mobileNavOpen=true as aria-expanded='true' (triangulation)", async () => {
    await renderNavbar({ mobileNavOpen: true, onOpenMobileNav: vi.fn() })

    expect(screen.getByRole("button", { name: /Abrir menú/i })).toHaveAttribute("aria-expanded", "true")
  })
})
