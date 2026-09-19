interface WelcomeUser {
  name?: string | null
  email?: string | null
}

// Dashboard greeting subject: prefer the Supabase user_metadata name (same
// source Navbar reads), fall back to the local-part of the email (before
// "@"), and finally null so the page greets with no name at all rather than
// the literal "Usuario" placeholder — there is nothing meaningful to greet
// with. The sentence around the name ("Bienvenido …"/"Welcome …") is a
// translation, so it lives in app.json, not here.
export function getWelcomeName(user: WelcomeUser | null): string | null {
  const name = user?.name?.trim()
  if (name) return name

  const email = user?.email?.trim()
  if (email) {
    const localPart = email.split("@")[0]
    if (localPart) return localPart
  }

  return null
}
