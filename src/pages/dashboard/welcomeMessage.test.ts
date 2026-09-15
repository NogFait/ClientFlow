import { describe, expect, it } from "vitest"
import { getWelcomeMessage } from "./welcomeMessage"

describe("getWelcomeMessage", () => {
  it("greets by name when the Supabase user has one in user_metadata", () => {
    expect(getWelcomeMessage({ name: "Fausto", email: "fausto@example.com" })).toBe("Bienvenido Fausto")
  })

  it("falls back to the email local-part when there is no name (triangulation: different user)", () => {
    expect(getWelcomeMessage({ name: null, email: "maria.lopez@example.com" })).toBe("Bienvenido maria.lopez")
  })

  it("falls back to plain 'Bienvenido' (no trailing name) when there is neither a name nor an email", () => {
    expect(getWelcomeMessage({ name: null, email: null })).toBe("Bienvenido")
  })

  it("falls back to plain 'Bienvenido' when there is no session/user at all", () => {
    expect(getWelcomeMessage(null)).toBe("Bienvenido")
  })
})
