import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ClientsPage from "./ClientsPage"
import { LimitExceededError } from "../../features/billing/domain/errors"
import type { Entitlements } from "../../features/billing/types"

// WARNING from sdd/saas-conversion/verify-report-m1 (#1132): the spec scenario
// "Limit hit on Clients page triggers modal" had no integration-level test —
// UpgradePrompt, canCreate and LimitExceededError were each unit-tested in
// isolation, but the actual wiring (handleLimitExceeded catching the error
// from a real form submit and rendering UpgradePrompt) was never exercised.

const getClientsMock = vi.fn()
const createClientMock = vi.fn()

vi.mock("../../features/clients/services", () => ({
  getClients: () => getClientsMock(),
  createClient: (client: unknown) => createClientMock(client),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
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
  refreshEntitlementsMock.mockReset()
})

describe("ClientsPage — limit exceeded flow", () => {
  it("shows the UpgradePrompt when creating a client hits the plan limit", async () => {
    const user = userEvent.setup()
    getClientsMock.mockResolvedValue([])
    createClientMock.mockRejectedValue(
      new LimitExceededError({ resource: "clientes", limit: 3, current: 3, plan: "free" }),
    )

    const { container } = render(<ClientsPage />)

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

    const { container } = render(<ClientsPage />)

    await waitFor(() => expect(screen.getByText(/no hay clientes registrados/i)).toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: /nuevo cliente/i }))
    await user.type(container.querySelector("form input")!, "Cliente Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => expect(createClientMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/alcanzaste el límite de tu plan/i)).not.toBeInTheDocument()
  })
})
