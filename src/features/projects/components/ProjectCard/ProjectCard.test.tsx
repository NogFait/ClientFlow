import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import ProjectCard from "./ProjectCard"
import type { IProject } from "../../types"

const project: IProject & { clientes?: { name: string } | null } = {
  id: "p1",
  name: "Sitio Web",
  status: "activo",
  clientes: { name: "Acme" },
}

// The whole card is the "ver" affordance — clicking or activating it with
// the keyboard navigates to the project hub. A probe route stands in for
// the real hub page so these tests prove navigation actually happened.
function renderCard(onEdit = vi.fn(), onDelete = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={["/projects"]}>
      <Routes>
        <Route path="/projects" element={<ProjectCard project={project} onEdit={onEdit} onDelete={onDelete} />} />
        <Route path="/projects/:id" element={<div>Project Hub Mock</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("ProjectCard — whole card opens the hub", () => {
  it("exposes the card as an accessible link named after the project", () => {
    renderCard()

    const card = screen.getByRole("link", { name: "Abrir proyecto Sitio Web" })
    expect(card).toHaveAttribute("tabindex", "0")
  })

  it("navigates to /projects/:id when the card body is clicked", async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole("link", { name: "Abrir proyecto Sitio Web" }))

    expect(await screen.findByText("Project Hub Mock")).toBeInTheDocument()
  })

  it("navigates on Enter while the card is focused (triangulation: keyboard)", async () => {
    const user = userEvent.setup()
    renderCard()

    screen.getByRole("link", { name: "Abrir proyecto Sitio Web" }).focus()
    await user.keyboard("{Enter}")

    expect(await screen.findByText("Project Hub Mock")).toBeInTheDocument()
  })

  it("navigates on Space while the card is focused (triangulation: second key)", async () => {
    const user = userEvent.setup()
    renderCard()

    screen.getByRole("link", { name: "Abrir proyecto Sitio Web" }).focus()
    await user.keyboard(" ")

    expect(await screen.findByText("Project Hub Mock")).toBeInTheDocument()
  })
})

describe("ProjectCard — inner action buttons don't trigger navigation", () => {
  it("calls onEdit and does not navigate when Editar is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderCard(onEdit)

    await user.click(screen.getByRole("button", { name: "Editar" }))

    expect(onEdit).toHaveBeenCalledWith(project)
    expect(screen.queryByText("Project Hub Mock")).not.toBeInTheDocument()
  })

  it("calls onDelete and does not navigate when Eliminar is clicked (triangulation: different button)", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderCard(undefined, onDelete)

    await user.click(screen.getByRole("button", { name: "Eliminar" }))

    expect(onDelete).toHaveBeenCalledWith(project)
    expect(screen.queryByText("Project Hub Mock")).not.toBeInTheDocument()
  })
})
