import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import ClientRanking from "./ClientRanking"
import { formatCurrency } from "../../../../utils/currency"

const money = (n: number) => formatCurrency(n).replace(/\u00A0/g, " ")

describe("ClientRanking", () => {
  it("lists the top clients with collected, pending and project count, best first", () => {
    render(
      <ClientRanking
        year={2026}
        rows={[
          { clientId: "c2", name: "Pepe", collected: 200000, pending: 0, projects: 1 },
          { clientId: "c1", name: "Tita", collected: 150000, pending: 30000, projects: 2 },
        ]}
      />,
    )

    expect(screen.getByRole("heading", { name: /Quién te deja más plata/i })).toBeInTheDocument()
    expect(screen.getByText("2026")).toBeInTheDocument()
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText("Pepe")).toBeInTheDocument()
    expect(within(items[0]).getByText(money(200000))).toBeInTheDocument()
    expect(within(items[1]).getByText("Tita")).toBeInTheDocument()
    expect(within(items[1]).getByText(money(150000))).toBeInTheDocument()
    expect(within(items[1]).getByText(new RegExp(`${money(30000).replace(/[$.]/g, "\\$&")} pendiente`))).toBeInTheDocument()
    expect(within(items[1]).getByText(/2 proyectos/)).toBeInTheDocument()
  })

  it("shows at most five clients", () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({
      clientId: `c${i}`, name: `Cliente ${i}`, collected: 700 - i, pending: 0, projects: 1,
    }))
    render(<ClientRanking year={2026} rows={rows} />)

    expect(screen.getAllByRole("listitem")).toHaveLength(5)
  })

  it("explains what will appear when nothing has been collected or owed yet", () => {
    render(<ClientRanking year={2026} rows={[{ clientId: "c1", name: "Tita", collected: 0, pending: 0, projects: 0 }]} />)

    expect(screen.queryByRole("listitem")).not.toBeInTheDocument()
    expect(screen.getByText(/Cuando registres cobros/i)).toBeInTheDocument()
  })
})
