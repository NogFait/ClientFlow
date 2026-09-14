import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("BILLING_ENABLED", () => {
  it("is true when VITE_BILLING_ENABLED is exactly 'true'", async () => {
    vi.stubEnv("VITE_BILLING_ENABLED", "true")
    vi.resetModules()
    const { BILLING_ENABLED } = await import("./features")
    expect(BILLING_ENABLED).toBe(true)
  })

  it("is false for any other value, including 'false' (triangulation)", async () => {
    vi.stubEnv("VITE_BILLING_ENABLED", "false")
    vi.resetModules()
    const { BILLING_ENABLED } = await import("./features")
    expect(BILLING_ENABLED).toBe(false)
  })
})
