import { supabase } from "../../services/supabaseClient";
import type { IUser } from "./types";

// Errors this module raises itself (as opposed to Supabase's, whose message
// is passed through untouched). They carry a CODE, not a sentence: this is
// a plain service with no access to the i18n instance, so the form hook
// that catches it (useAuth.ts) maps the code to auth.json's `errors.*`.
export type AuthErrorCode = "signupNoUser" | "emailNotConfirmed"

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.name = "AuthError"
    this.code = code
  }
}

// Where the confirmation link in the signup email lands. Supabase's "Confirm
// email" is ON, and its default target is the Site URL (the marketing home).
// /login is the right place: supabase-js (implicit flow) reads the session
// from the URL hash there, and PublicOnlyRoute then moves the now-signed-in
// user on to /dashboard. Must stay inside the dashboard's redirect allow-list.
function confirmationRedirectUrl() {
  return `${window.location.origin}/login`
}

export async function signUpUser(data: IUser) {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.contrasena, /* contraseña */
    options: { emailRedirectTo: confirmationRedirectUrl() },
  });
  if (error) throw new Error(error.message);
  if (!result.user) throw new AuthError("signupNoUser");
}

export async function signInUser(data: IUser) {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.contrasena, /* contraseña */
  });
  if (error?.code === "email_not_confirmed") throw new AuthError("emailNotConfirmed");
  if (error) throw new Error(error.message);
}

// Re-sends the signup confirmation email. Supabase enforces its own minimum
// interval per address (60s by default) and answers with a message when the
// request is too soon — that message is passed through as-is.
export async function resendSignupConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: confirmationRedirectUrl() },
  });
  if (error) throw new Error(error.message);
}
