import { describe, expect, it } from "vitest"
import { getWelcomeName } from "./welcomeMessage"

// The greeting itself ("Bienvenido {{name}}" / "Welcome {{name}}") lives in
// app.json; this module only decides WHO to greet.
describe("getWelcomeName", () => {
  it("prefers the Supabase user_metadata name", () => {
    expect(getWelcomeName({ name: "Fausto", email: "fausto@example.com" })).toBe("Fausto")
  })

  it("falls back to the email local-part when there is no name (triangulation: different user)", () => {
    expect(getWelcomeName({ name: null, email: "maria.lopez@example.com" })).toBe("maria.lopez")
  })

  it("returns null when there is neither a name nor an email", () => {
    expect(getWelcomeName({ name: "  ", email: null })).toBeNull()
  })

  it("returns null when there is no session/user at all", () => {
    expect(getWelcomeName(null)).toBeNull()
  })
})
