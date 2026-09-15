import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import ProjectCard from "./ProjectCard"
import type { IProject } from "../../types"

const project: IProject & { clientes?: { name: string } | null } = {
  id: "p1",
  name: "Sitio Web",
  status: "activo",
  clientes: { name: "Acme" },
}

function renderCard() {
  return render(
    <MemoryRouter>
      <ProjectCard project={project} onEdit={vi.fn()} onDelete={vi.fn()} />
    </MemoryRouter>,
  )
}

describe("ProjectCard — navigation to the project hub", () => {
  it("renders 'Ver' as a link to /projects/:id (no view modal)", () => {
    renderCard()

    const link = screen.getByRole("link", { name: /ver/i })
    expect(link).toHaveAttribute("href", "/projects/p1")
  })

  it("renders the project title as a link to the hub too (triangulation: second entry point)", () => {
    renderCard()

    const titleLink = screen.getByRole("link", { name: "Sitio Web" })
    expect(titleLink).toHaveAttribute("href", "/projects/p1")
  })
})
