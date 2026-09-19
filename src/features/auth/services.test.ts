import { describe, expect, it, vi } from "vitest"

const signUpMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: { auth: { signUp: (args: unknown) => signUpMock(args), signInWithPassword: vi.fn() } },
}))

describe("signUpUser", () => {
  it("throws an AuthError carrying a translatable code (not a Spanish sentence) when Supabase returns no user", async () => {
    signUpMock.mockResolvedValue({ data: { user: null }, error: null })
    const { signUpUser, AuthError } = await import("./services")

    await expect(signUpUser({ email: "a@b.c", contrasena: "secret" })).rejects.toSatisfy(
      (error: unknown) => error instanceof AuthError && error.code === "signupNoUser",
    )
  })

  it("re-throws Supabase's own message untouched (triangulation: provider error)", async () => {
    signUpMock.mockResolvedValue({ data: { user: null }, error: { message: "User already registered" } })
    const { signUpUser } = await import("./services")

    await expect(signUpUser({ email: "a@b.c", contrasena: "secret" })).rejects.toThrow("User already registered")
  })
})
