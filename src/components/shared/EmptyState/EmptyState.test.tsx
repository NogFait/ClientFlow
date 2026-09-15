import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Users } from "lucide-react"
import EmptyState from "./EmptyState"

describe("EmptyState", () => {
  it("renders the icon, title and description", () => {
    render(
      <EmptyState
        icon={Users}
        title="Todavía no tenés clientes"
        description="Cargá a las personas o empresas para las que trabajás."
      />,
    )

    expect(screen.getByText("Todavía no tenés clientes")).toBeInTheDocument()
    expect(screen.getByText("Cargá a las personas o empresas para las que trabajás.")).toBeInTheDocument()
  })

  it("does not render a CTA button when no actionLabel/onAction is given", () => {
    render(<EmptyState icon={Users} title="Sin datos" description="Nada por acá." />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("calls onAction when the CTA button is clicked (triangulation: different label/handler)", async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <EmptyState
        icon={Users}
        title="Todavía no tenés proyectos"
        description="Un proyecto agrupa tareas y pagos de un cliente."
        actionLabel="Crear primer proyecto"
        onAction={onAction}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Crear primer proyecto" }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
