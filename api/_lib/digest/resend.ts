// Minimal Resend client: one endpoint, no SDK. Injected fetch keeps it
// unit-testable and free of network in tests.

export interface OutgoingEmail {
  to: string
  subject: string
  html: string
  text: string
}

export type EmailSender = (email: OutgoingEmail) => Promise<{ id: string }>

interface ResendSenderOptions {
  apiKey: string
  from: string
  fetchImpl?: typeof fetch
}

export function createResendSender({ apiKey, from, fetchImpl = fetch }: ResendSenderOptions): EmailSender {
  return async (email) => {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, html: email.html, text: email.text }),
    })
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!response.ok) throw new Error(`Resend ${response.status}: ${body.message ?? "unknown error"}`)
    return { id: body.id ?? "" }
  }
}
