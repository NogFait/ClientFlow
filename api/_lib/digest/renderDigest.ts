import type { WeeklyDigest } from "./buildDigest.js"

// The Monday email. Spanish only — the digest is a Pro feature for the
// Argentine audience; an EN variant can follow the user's stored
// preference once that preference lives server-side. Inline styles: email
// clients ignore stylesheets.

interface RenderOptions {
  appUrl: string
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// "$ 100.000" — whole pesos, es-AR grouping. Kept dependency-free on purpose.
export function formatArs(amount: number): string {
  const rounded = Math.round(amount)
  const grouped = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${rounded < 0 ? "-" : ""}$ ${grouped}`
}

// "23/9" from "2026-09-23"
const shortDate = (dateOnly: string) => {
  const [, m, d] = dateOnly.split("-")
  return `${Number(d)}/${Number(m)}`
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function renderDigestEmail(digest: WeeklyDigest, { appUrl }: RenderOptions): RenderedEmail {
  const headline: string[] = []
  if (digest.paymentsDue.length > 0) headline.push(`${formatArs(digest.paymentsDueTotal)} por cobrar`)
  if (digest.overdue.length > 0) headline.push(plural(digest.overdue.length, "vencido", "vencidos"))
  if (digest.tasksDue.length > 0) headline.push(plural(digest.tasksDue.length, "tarea", "tareas"))
  if (digest.staleClients.length > 0 && headline.length === 0)
    headline.push(plural(digest.staleClients.length, "cliente sin contacto", "clientes sin contacto"))
  const subject = `Tu semana en ClientFlow: ${headline.join(", ")}`

  const sections: { title: string; rows: { left: string; right: string }[]; note?: string }[] = []
  if (digest.paymentsDue.length > 0) {
    sections.push({
      title: "Pagos por vencer esta semana",
      rows: digest.paymentsDue.map((p) => ({
        left: `${shortDate(p.date)} · ${[p.client, p.project].filter(Boolean).join(" · ")}`,
        right: formatArs(p.amount),
      })),
      note: `Total: ${formatArs(digest.paymentsDueTotal)}`,
    })
  }
  if (digest.overdue.length > 0) {
    sections.push({
      title: "Pagos vencidos",
      rows: digest.overdue.map((p) => ({
        left: `${shortDate(p.date)} · ${[p.client, p.project].filter(Boolean).join(" · ")}`,
        right: formatArs(p.amount),
      })),
      note: `Total vencido: ${formatArs(digest.overdueTotal)}`,
    })
  }
  if (digest.tasksDue.length > 0) {
    sections.push({
      title: "Tareas para esta semana",
      rows: digest.tasksDue.map((t) => ({
        left: `${shortDate(t.date)} · ${t.title}${t.project ? ` (${t.project})` : ""}`,
        right: "",
      })),
    })
  }
  if (digest.staleClients.length > 0) {
    sections.push({
      title: "Sin contacto hace más de 30 días",
      rows: digest.staleClients.map((c) => ({ left: c.name, right: `${c.daysSinceContact} días` })),
      note: "Una nota o un mensaje esta semana mantiene la relación viva.",
    })
  }

  const htmlSections = sections
    .map(
      (s) => `
      <h2 style="font-size: 15px; margin: 24px 0 8px; color: #111827;">${escapeHtml(s.title)}</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        ${s.rows
          .map(
            (r) => `<tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #f3f4f6; color: #374151;">${escapeHtml(r.left)}</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #f3f4f6; text-align: right; white-space: nowrap; font-weight: 600; color: #111827;">${escapeHtml(r.right)}</td>
        </tr>`,
          )
          .join("")}
      </table>
      ${s.note ? `<p style="font-size: 13px; color: #6b7280; margin: 8px 0 0;">${escapeHtml(s.note)}</p>` : ""}`,
    )
    .join("")

  const html = `<div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
  <p style="font-size: 20px; font-weight: 700; color: #7c3aed; margin: 0 0 4px;">ClientFlow</p>
  <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">Tu resumen de la semana</p>
  ${htmlSections}
  <p style="margin: 28px 0 0;">
    <a href="${appUrl}/dashboard" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px;">Abrir ClientFlow</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 16px;">
  <p style="font-size: 12px; color: #9ca3af; margin: 0;">Recibís este resumen porque tenés el plan Pro. Podés apagarlo en <a href="${appUrl}/settings/billing" style="color: #7c3aed;">Plan y facturación</a>.</p>
</div>`

  const text = [
    "ClientFlow — Tu resumen de la semana",
    "",
    ...sections.flatMap((s) => [
      s.title,
      ...s.rows.map((r) => (r.right ? `- ${r.left} — ${r.right}` : `- ${r.left}`)),
      ...(s.note ? [s.note] : []),
      "",
    ]),
    `Abrir ClientFlow: ${appUrl}/dashboard`,
    `Apagar este resumen: ${appUrl}/settings/billing`,
  ].join("\n")

  return { subject, html, text }
}
