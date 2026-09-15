import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import ClientsPage from "./ClientsPage"
import { LimitExceededError } from "../../features/billing/domain/errors"
import type { Entitlements } from "../../features/billing/types"

function renderClientsPage() {
  return render(
    <MemoryRouter initialEntries={["/clients"]}>
      <Routes>
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/settings/billing" element={<div>Billing Settings Mock</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// WARNING from sdd/saas-conversion/verify-report-m1 (#1132): the spec scenario
// "Limit hit on Clients page triggers modal" had no integration-level test —
// UpgradePrompt, canCreate and LimitExceededError were each unit-tested in
// isolation, but the actual wiring (handleLimitExceeded catching the error
// from a real form submit and rendering UpgradePrompt) was never exercised.

const getClientsMock = vi.fn()
const createClientMock = vi.fn()
const deleteClientMock = vi.fn()

vi.mock("../../features/clients/services", () => ({
  getClients: () => getClientsMock(),
  createClient: (client: unknown) => createClientMock(client),
  updateClient: vi.fn(),
  deleteClient: (id: string) => deleteClientMock(id),
}))

// Entitlements permissive enough that the soft pre-check in
// handleNewClientAction (canCreate) does NOT block — this test exercises the
// server-side LimitExceededError path (the trigger rejecting the INSERT),
// not the client-side soft pre-check.
const freeEntitlementsUnderLimit: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 0, proyectos: 0 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

const refreshEntitlementsMock = vi.fn()

vi.mock("../../features/billing/context/entitlementsContext", () => ({
  useEntitlementsContext: () => ({
    entitlements: freeEntitlementsUnderLimit,
    refresh: refreshEntitlementsMock,
    loading: false,
  }),
}))

afterEach(() => {
  getClientsMock.mockReset()
  createClientMock.mockReset()
  deleteClientMock.mockReset()
  refreshEntitlementsMock.mockReset()
  // Restore the desktop-default matchMedia stub (src/test/setup.ts) rather
  // than deleting it — some tests below override it to simulate mobile.
  installMatchMedia(false)
})

const sampleClient = {
  id: "c1",
  name: "Juan Pérez",
  email: "juan@example.com",
  celular: "123456789",
  company: "Acme",
  status: "activo" as const,
  created_at: "2026-01-01T00:00:00.000Z",
}

function installMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia
}

describe("ClientsPage — limit exceeded flow", () => {
  it("shows the UpgradePrompt when creating a client hits the plan limit", async () => {
    const user = userEvent.setup()
    getClientsMock.mockResolvedValue([])
    createClientMock.mockRejectedValue(
      new LimitExceededError({ resource: "clientes", limit: 3, current: 3, plan: "free" }),
    )

    const { container } = renderClientsPage()

    await waitFor(() => expect(screen.getByText(/no hay clientes registrados/i)).toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: /nuevo cliente/i }))
    // ClientForm's "Nombre" <label> has no htmlFor/id pairing with its
    // <input> (a pre-existing gap in that component, out of scope here), so
    // getByLabelText can't resolve it — the Nombre field is the form's first
    // text input, queried positionally instead.
    await user.type(container.querySelector("form input")!, "Cliente Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText(/alcanzaste el límite de tu plan/i)).toBeInTheDocument()
    expect(screen.getByText(/3\s*\/\s*3/)).toBeInTheDocument()
    expect(createClientMock).toHaveBeenCalledTimes(1)
    // The create-form modal must be closed in favor of the upgrade prompt.
    expect(screen.queryByRole("button", { name: /guardar/i })).not.toBeInTheDocument()
  })

  it("does NOT show the UpgradePrompt when the create succeeds (triangulation)", async () => {
    const user = userEvent.setup()
    getClientsMock.mockResolvedValue([])
    createClientMock.mockResolvedValue(undefined)

    const { container } = renderClientsPage()

    await waitFor(() => expect(screen.getByText(/no hay clientes registrados/i)).toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: /nuevo cliente/i }))
    await user.type(container.querySelector("form input")!, "Cliente Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => expect(createClientMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/alcanzaste el límite de tu plan/i)).not.toBeInTheDocument()
  })
})

describe("ClientsPage — upgrade CTA navigation", () => {
  it("navigates to /settings/billing when the monthly CTA in UpgradePrompt is clicked", async () => {
    const user = userEvent.setup()
    getClientsMock.mockResolvedValue([])
    createClientMock.mockRejectedValue(
      new LimitExceededError({ resource: "clientes", limit: 3, current: 3, plan: "free" }),
    )

    const { container } = renderClientsPage()

    await waitFor(() => expect(screen.getByText(/no hay clientes registrados/i)).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: /nuevo cliente/i }))
    await user.type(container.querySelector("form input")!, "Cliente Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))
    await screen.findByText(/alcanzaste el límite de tu plan/i)

    await user.click(screen.getByRole("button", { name: /mensual/i }))

    expect(await screen.findByText("Billing Settings Mock")).toBeInTheDocument()
  })

  it("navigates to /settings/billing when the yearly CTA is clicked (triangulation: different button)", async () => {
    const user = userEvent.setup()
    getClientsMock.mockResolvedValue([])
    createClientMock.mockRejectedValue(
      new LimitExceededError({ resource: "clientes", limit: 3, current: 3, plan: "free" }),
    )

    const { container } = renderClientsPage()

    await waitFor(() => expect(screen.getByText(/no hay clientes registrados/i)).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: /nuevo cliente/i }))
    await user.type(container.querySelector("form input")!, "Cliente Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))
    await screen.findByText(/alcanzaste el límite de tu plan/i)

    await user.click(screen.getByRole("button", { name: /anual/i }))

    expect(await screen.findByText("Billing Settings Mock")).toBeInTheDocument()
  })
})

describe("ClientsPage — delete confirmation", () => {
  it("opens a confirm dialog (not window.confirm) when Eliminar is clicked, and does not delete until confirmed", async () => {
    const user = userEvent.setup()
    getClientsMock.mockResolvedValue([sampleClient])

    renderClientsPage()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("¿Eliminar a Juan Pérez?")).toBeInTheDocument()
    expect(deleteClientMock).not.toHaveBeenCalled()
  })

  it("calls deleteClient and refreshes the list when the dialog is confirmed", async () => {
    const user = userEvent.setup()
    getClientsMock.mockResolvedValue([sampleClient])
    deleteClientMock.mockResolvedValue(undefined)

    renderClientsPage()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    await waitFor(() => expect(deleteClientMock).toHaveBeenCalledWith("c1"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("does NOT call deleteClient when the dialog is cancelled (triangulation)", async () => {
    const user = userEvent.setup()
    getClientsMock.mockResolvedValue([sampleClient])

    renderClientsPage()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(deleteClientMock).not.toHaveBeenCalled()
  })
})

describe("ClientsPage — responsive table/card layout", () => {
  it("renders the table on desktop viewports", async () => {
    installMatchMedia(false)
    getClientsMock.mockResolvedValue([sampleClient])

    renderClientsPage()

    expect(await screen.findByRole("table")).toBeInTheDocument()
  })

  it("renders a mobile card list with reachable action buttons on narrow viewports (triangulation)", async () => {
    installMatchMedia(true)
    getClientsMock.mockResolvedValue([sampleClient])

    renderClientsPage()

    expect(await screen.findByRole("button", { name: /ver a juan pérez/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /editar a juan pérez/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar a juan pérez/i })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})
