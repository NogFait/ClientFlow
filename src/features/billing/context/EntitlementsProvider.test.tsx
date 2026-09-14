import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { Entitlements } from "../types"
import type { useEntitlementsContext as UseEntitlementsContextFn } from "./entitlementsContext"

const { fakeEntitlements } = vi.hoisted(() => ({
  fakeEntitlements: {
    plan: "free",
    status: "free",
    limits: { clientes: 3, proyectos: 5 },
    usage: { clientes: 0, proyectos: 0 },
    current_period_end: null,
    cancel_at_period_end: false,
    grace_until: null,
  } satisfies Entitlements,
}))

vi.mock("../services", () => ({
  getEntitlements: vi.fn().mockResolvedValue(fakeEntitlements),
}))

function makeConsumer(useEntitlementsContextHook: typeof UseEntitlementsContextFn) {
  return function Consumer() {
    const { entitlements } = useEntitlementsContextHook()
    return <span data-testid="ctx-plan">{entitlements?.plan ?? "none"}</span>
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("EntitlementsProvider", () => {
  it("exposes useEntitlements' state to descendants via context", async () => {
    vi.stubEnv("VITE_BILLING_ENABLED", "true")
    vi.resetModules()
    const { EntitlementsProvider } = await import("./EntitlementsProvider")
    const { useEntitlementsContext } = await import("./entitlementsContext")
    const Consumer = makeConsumer(useEntitlementsContext)

    render(
      <EntitlementsProvider>
        <Consumer />
      </EntitlementsProvider>,
    )

    expect(await screen.findByTestId("ctx-plan")).toHaveTextContent("free")
  })

  it("throws a descriptive error when the context is read outside a provider (triangulation)", async () => {
    const { useEntitlementsContext } = await import("./entitlementsContext")
    const Consumer = makeConsumer(useEntitlementsContext)
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<Consumer />)).toThrow("useEntitlementsContext must be used within an EntitlementsProvider")

    consoleErrorSpy.mockRestore()
  })
})
