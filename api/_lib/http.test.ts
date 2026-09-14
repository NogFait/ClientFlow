import { describe, expect, it } from "vitest"
import { resolveAppOrigin } from "./http.js"

describe("resolveAppOrigin", () => {
  it("prefers the Origin header when present", () => {
    const origin = resolveAppOrigin({ origin: "https://app.example.com", "x-forwarded-host": "ignored.example.com" })
    expect(origin).toBe("https://app.example.com")
  })

  it("falls back to x-forwarded-host/x-forwarded-proto when Origin is absent", () => {
    const origin = resolveAppOrigin({ "x-forwarded-host": "client-flow-xi.vercel.app", "x-forwarded-proto": "https" })
    expect(origin).toBe("https://client-flow-xi.vercel.app")
  })

  it("defaults the forwarded protocol to https when x-forwarded-proto is missing", () => {
    const origin = resolveAppOrigin({ "x-forwarded-host": "client-flow-xi.vercel.app" })
    expect(origin).toBe("https://client-flow-xi.vercel.app")
  })

  it("takes the first value when a header arrives as an array", () => {
    const origin = resolveAppOrigin({ origin: ["https://first.example.com", "https://second.example.com"] })
    expect(origin).toBe("https://first.example.com")
  })

  it("throws when neither Origin nor x-forwarded-host is present", () => {
    expect(() => resolveAppOrigin({})).toThrow(/origin/i)
  })
})
