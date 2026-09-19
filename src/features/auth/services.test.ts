import { beforeEach, describe, expect, it, vi } from "vitest"

const signUpMock = vi.fn()
const signInMock = vi.fn()
const resendMock = vi.fn()
const resetPasswordForEmailMock = vi.fn()
const updateUserMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: (args: unknown) => signUpMock(args),
      signInWithPassword: (args: unknown) => signInMock(args),
      resend: (args: unknown) => resendMock(args),
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmailMock(...args),
      updateUser: (args: unknown) => updateUserMock(args),
    },
  },
}))

beforeEach(() => {
  signUpMock.mockReset()
  signInMock.mockReset()
  resendMock.mockReset()
  resetPasswordForEmailMock.mockReset()
  updateUserMock.mockReset()
})

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

  it("sends the confirmation link back to this origin's /login (Confirm email is ON: the link must not land on the marketing home)", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const { signUpUser } = await import("./services")

    await signUpUser({ email: "a@b.c", contrasena: "secret" })

    expect(signUpMock).toHaveBeenCalledWith({
      email: "a@b.c",
      password: "secret",
      options: { emailRedirectTo: `${window.location.origin}/login` },
    })
  })
})

describe("signInUser", () => {
  it("throws an AuthError with code emailNotConfirmed when Supabase rejects an unconfirmed account", async () => {
    signInMock.mockResolvedValue({ error: { code: "email_not_confirmed", message: "Email not confirmed" } })
    const { signInUser, AuthError } = await import("./services")

    await expect(signInUser({ email: "a@b.c", contrasena: "secret" })).rejects.toSatisfy(
      (error: unknown) => error instanceof AuthError && error.code === "emailNotConfirmed",
    )
  })

  it("re-throws any other Supabase error message untouched (triangulation)", async () => {
    signInMock.mockResolvedValue({ error: { code: "invalid_credentials", message: "Invalid login credentials" } })
    const { signInUser } = await import("./services")

    await expect(signInUser({ email: "a@b.c", contrasena: "secret" })).rejects.toThrow("Invalid login credentials")
  })
})

describe("resendSignupConfirmation", () => {
  it("asks Supabase to resend the signup confirmation for that email, with the same /login redirect", async () => {
    resendMock.mockResolvedValue({ error: null })
    const { resendSignupConfirmation } = await import("./services")

    await resendSignupConfirmation("a@b.c")

    expect(resendMock).toHaveBeenCalledWith({
      type: "signup",
      email: "a@b.c",
      options: { emailRedirectTo: `${window.location.origin}/login` },
    })
  })

  it("re-throws Supabase's message when the resend is refused (e.g. rate limited)", async () => {
    resendMock.mockResolvedValue({ error: { message: "For security purposes, you can only request this after 42 seconds." } })
    const { resendSignupConfirmation } = await import("./services")

    await expect(resendSignupConfirmation("a@b.c")).rejects.toThrow("only request this after 42 seconds")
  })
})

describe("requestPasswordReset", () => {
  it("asks Supabase for a recovery email whose link lands on this origin's /reset-password", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null })
    const { requestPasswordReset } = await import("./services")

    await requestPasswordReset("a@b.c")

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("a@b.c", {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  })

  it("re-throws Supabase's message when the request is refused (e.g. rate limited)", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: { message: "For security purposes, you can only request this after 42 seconds." } })
    const { requestPasswordReset } = await import("./services")

    await expect(requestPasswordReset("a@b.c")).rejects.toThrow("only request this after 42 seconds")
  })
})

describe("updatePassword", () => {
  it("sets the new password on the current (recovery) session — no current password, the user forgot it", async () => {
    updateUserMock.mockResolvedValue({ error: null })
    const { updatePassword } = await import("./services")

    await updatePassword("n3w-secret")

    expect(updateUserMock).toHaveBeenCalledWith({ password: "n3w-secret" })
  })

  it("re-throws Supabase's message when the update is refused (triangulation: weak password)", async () => {
    updateUserMock.mockResolvedValue({ error: { message: "Password should be at least 8 characters." } })
    const { updatePassword } = await import("./services")

    await expect(updatePassword("short")).rejects.toThrow("at least 8 characters")
  })
})
