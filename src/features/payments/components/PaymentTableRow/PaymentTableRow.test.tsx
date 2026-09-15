import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import PaymentTableRow from "./PaymentTableRow"
import type { IPayment } from "../../types"

function renderRow(payment: IPayment & { project_id?: string; proyectos?: { name: string; clientes?: { name: string } | null } | null }) {
  return render(
    <MemoryRouter>
      <table>
        <tbody>
          <PaymentTableRow payment={payment} onView={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
        </tbody>
      </table>
    </MemoryRouter>,
  )
}

describe("PaymentTableRow — project name links to the hub", () => {
  it("renders the project name as a link to /projects/:project_id", () => {
    renderRow({
      id: "pay1",
      amount: 100,
      status: "pagado",
      method: "efectivo",
      project_id: "p1",
      proyectos: { name: "Sitio Web", clientes: { name: "Acme" } },
    })

    const link = screen.getByRole("link", { name: "Sitio Web" })
    expect(link).toHaveAttribute("href", "/projects/p1")
  })

  it("renders plain '—' (no link) when there is no project (triangulation)", () => {
    renderRow({ id: "pay2", amount: 50, status: "pendiente", method: "efectivo" })

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
