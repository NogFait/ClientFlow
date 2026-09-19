import { supabase } from "../../services/supabaseClient";
import type { IUser } from "./types";

// Errors this module raises itself (as opposed to Supabase's, whose message
// is passed through untouched). They carry a CODE, not a sentence: this is
// a plain service with no access to the i18n instance, so the form hook
// that catches it (useAuth.ts) maps the code to auth.json's `errors.*`.
export type AuthErrorCode = "signupNoUser"

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.name = "AuthError"
    this.code = code
  }
}

export async function signUpUser(data: IUser) {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.contrasena, /* contraseña */
  });
  if (error) throw new Error(error.message);
  if (!result.user) throw new AuthError("signupNoUser");
}

export async function signInUser(data: IUser) {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.contrasena, /* contraseña */
  });
  if (error) throw new Error(error.message);
}
