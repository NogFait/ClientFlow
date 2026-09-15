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

// "Ver" is the discoverable link into the project hub; clicking the card body
// is a mouse shortcut to the same place. A probe route stands in for the real
// hub page so these tests prove navigation actually happened.
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

describe("ProjectCard — 'Ver' opens the hub", () => {
  it("renders a visible 'Ver' link to /projects/:id", () => {
    renderCard()

    const ver = screen.getByRole("link", { name: "Ver proyecto Sitio Web" })
    expect(ver).toHaveTextContent("Ver")
    expect(ver).toHaveAttribute("href", "/projects/p1")
  })

  it("navigates to the hub when 'Ver' is clicked", async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole("link", { name: "Ver proyecto Sitio Web" }))

    expect(await screen.findByText("Project Hub Mock")).toBeInTheDocument()
  })

  it("reaches 'Ver' with the keyboard and activates it with Enter (triangulation: keyboard)", async () => {
    const user = userEvent.setup()
    renderCard()

    await user.tab()
    expect(screen.getByRole("link", { name: "Ver proyecto Sitio Web" })).toHaveFocus()
    await user.keyboard("{Enter}")

    expect(await screen.findByText("Project Hub Mock")).toBeInTheDocument()
  })

  it("also navigates when the card body is clicked (mouse shortcut)", async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByTestId("project-card-p1"))

    expect(await screen.findByText("Project Hub Mock")).toBeInTheDocument()
  })

  it("does not expose the card itself as a link (no nested interactive elements)", () => {
    renderCard()

    expect(screen.queryByRole("link", { name: /Abrir proyecto/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole("link")).toHaveLength(1)
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
