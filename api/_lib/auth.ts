import type { SupabaseClient } from "@supabase/supabase-js"

export interface AuthenticatedUser {
  userId: string
  email: string | null
}

export interface MinimalRequest {
  headers: Record<string, string | string[] | undefined>
}

const BEARER_PREFIX = "Bearer "

// Verifies the caller's Supabase session server-side (design §3) — 401
// before any provider (Polar) call is made. Takes the admin client as a
// param (not the module singleton) so handlers stay unit-testable.
export async function getUserFromRequest(
  req: MinimalRequest,
  supabaseAdmin: SupabaseClient
): Promise<AuthenticatedUser | null> {
  const header = req.headers.authorization
  const value = Array.isArray(header) ? header[0] : header
  if (!value || !value.startsWith(BEARER_PREFIX)) return null

  const token = value.slice(BEARER_PREFIX.length).trim()
  if (!token) return null

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null

  return { userId: data.user.id, email: data.user.email ?? null }
}

export interface MinimalResponse {
  status(code: number): { json(body: unknown): void }
}

export function sendUnauthorized(res: MinimalResponse): void {
  res.status(401).json({ error: "unauthorized" })
}
