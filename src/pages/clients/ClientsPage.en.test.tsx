import { afterEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import ClientsPage from "./ClientsPage"
import { renderWithLang } from "../../test/i18n"
import type { Entitlements } from "../../features/billing/types"

const getClientsMock = vi.fn()

vi.mock("../../features/clients/notes/services", () => ({
  getClientNotes: vi.fn().mockResolvedValue([]),
  createClientNote: vi.fn(),
  deleteClientNote: vi.fn(),
}))

vi.mock("../../features/clients/services", () => ({
  getClients: () => getClientsMock(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
}))

vi.mock("../../features/projects/services", () => ({
  countProjectsByClient: vi.fn(),
}))

const entitlements: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 1, proyectos: 0 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

vi.mock("../../features/billing/context/entitlementsContext", () => ({
  useEntitlementsContext: () => ({ entitlements, refresh: vi.fn(), loading: false }),
}))

afterEach(() => {
  getClientsMock.mockReset()
})

describe("ClientsPage — English", () => {
  it("renders header, stats, table headers and translated status labels in English", async () => {
    getClientsMock.mockResolvedValue([
      { id: "c1", name: "Acme", email: "hi@acme.test", celular: "123", company: "Acme Inc", status: "activo" },
    ])

    renderWithLang(<ClientsPage />, "en", { initialEntries: ["/clients"] })

    expect(await screen.findByRole("heading", { name: "Clients" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /New Client/ })).toBeInTheDocument()
    expect(screen.getByText("Total Active")).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Phone" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Company" })).toBeInTheDocument()
    // Status VALUE stays "activo" in the data; only its label is translated.
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
    expect(screen.queryByText("Clientes")).not.toBeInTheDocument()
  })

  it("shows the English empty state when there are no clients (triangulation)", async () => {
    getClientsMock.mockResolvedValue([])

    renderWithLang(<ClientsPage />, "en", { initialEntries: ["/clients"] })

    expect(await screen.findByText("You don't have any clients yet")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add first client" })).toBeInTheDocument()
  })
})
