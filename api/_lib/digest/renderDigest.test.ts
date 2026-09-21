import { describe, expect, it } from "vitest"
import { renderDigestEmail } from "./renderDigest.js"

const digest = {
  paymentsDue: [{ amount: 100000, date: "2026-09-23", client: "Tita", project: "Web" }],
  paymentsDueTotal: 100000,
  overdue: [{ amount: 50000, date: "2026-09-10", client: "Pepe", project: 'Logo <"final">' }],
  overdueTotal: 50000,
  tasksDue: [{ title: "Entregar logo", date: "2026-09-24", project: "Logo" }],
  staleClients: [{ name: "Pepe & Co", daysSinceContact: 82 }],
}

describe("renderDigestEmail", () => {
  it("writes a subject that carries the headline numbers", () => {
    const { subject } = renderDigestEmail(digest, { appUrl: "https://clientflow.lat" })

    expect(subject).toBe("Tu semana en ClientFlow: $ 100.000 por cobrar, 1 vencido, 1 tarea")
  })

  it("renders every section in Spanish with dates as d/m and amounts in ARS, plus a plain-text twin", () => {
    const { html, text } = renderDigestEmail(digest, { appUrl: "https://clientflow.lat" })

    expect(html).toContain("Pagos por vencer esta semana")
    expect(html).toContain("23/9")
    expect(html).toContain("$ 100.000")
    expect(html).toContain("Pagos vencidos")
    expect(html).toContain("Tareas para esta semana")
    expect(html).toContain("Entregar logo")
    expect(html).toContain("Sin contacto hace más de 30 días")
    expect(html).toContain("82 días")
    expect(html).toContain('href="https://clientflow.lat/dashboard"')
    expect(html).toContain('href="https://clientflow.lat/settings/billing"')
    expect(text).toContain("Pagos vencidos")
    expect(text).toContain("Pepe · Logo")
  })

  it("escapes user content so a client or project name cannot inject HTML", () => {
    const { html } = renderDigestEmail(digest, { appUrl: "https://clientflow.lat" })

    expect(html).toContain("Logo &lt;&quot;final&quot;&gt;")
    expect(html).toContain("Pepe &amp; Co")
    expect(html).not.toContain('<"final">')
  })

  it("omits empty sections entirely", () => {
    const { html, subject } = renderDigestEmail(
      { ...digest, overdue: [], overdueTotal: 0, tasksDue: [], staleClients: [] },
      { appUrl: "https://clientflow.lat" },
    )

    expect(html).not.toContain("Pagos vencidos")
    expect(html).not.toContain("Tareas para esta semana")
    expect(html).not.toContain("Sin contacto")
    expect(subject).toBe("Tu semana en ClientFlow: $ 100.000 por cobrar")
  })
})
