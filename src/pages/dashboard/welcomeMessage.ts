interface WelcomeUser {
  name?: string | null
  email?: string | null
}

// Dashboard greeting: prefer the Supabase user_metadata name (same source
// Navbar reads), fall back to the local-part of the email (before "@"), and
// fall back to a plain "Bienvenido" with no name at all rather than the
// literal "Usuario" placeholder — there is nothing meaningful to greet with.
export function getWelcomeMessage(user: WelcomeUser | null): string {
  const name = user?.name?.trim()
  if (name) return `Bienvenido ${name}`

  const email = user?.email?.trim()
  if (email) {
    const localPart = email.split("@")[0]
    if (localPart) return `Bienvenido ${localPart}`
  }

  return "Bienvenido"
}
