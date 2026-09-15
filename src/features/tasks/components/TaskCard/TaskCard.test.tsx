import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import TaskCard from "./TaskCard"
import type { ITask } from "../../types"

function renderCard(task: ITask & { proyectos?: { name: string } | null }) {
  return render(
    <MemoryRouter>
      <TaskCard task={task} onView={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    </MemoryRouter>,
  )
}

describe("TaskCard — project name links to the hub", () => {
  it("renders the project name as a link to /projects/:project_id when a project is set", () => {
    renderCard({
      id: "t1",
      title: "Diseño",
      status: "pendiente",
      priority: "medium",
      project_id: "p1",
      proyectos: { name: "Sitio Web" },
    })

    const link = screen.getByRole("link", { name: "Sitio Web" })
    expect(link).toHaveAttribute("href", "/projects/p1")
  })

  it("renders plain '—' text (no link) when there is no project (triangulation)", () => {
    renderCard({ id: "t2", title: "Suelto", status: "pendiente", priority: "low" })

    expect(screen.getByText("—")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
