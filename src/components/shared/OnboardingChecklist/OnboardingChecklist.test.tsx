import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import OnboardingChecklist from "./OnboardingChecklist"

const STORAGE_KEY = "clientflow.onboarding.dismissed"

function renderChecklist(props: { hasClients: boolean; hasProjects: boolean; hasPayments: boolean }) {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<OnboardingChecklist {...props} />} />
        <Route path="/clients" element={<div>Clients Page Mock</div>} />
        <Route path="/projects" element={<div>Projects Page Mock</div>} />
        <Route path="/payments" element={<div>Payments Page Mock</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe("OnboardingChecklist", () => {
  it("shows all three steps as pending for a brand-new user (0 clients, 0 projects, 0 payments)", () => {
    renderChecklist({ hasClients: false, hasProjects: false, hasPayments: false })

    expect(screen.getByText("Empezá en 3 pasos")).toBeInTheDocument()
    expect(screen.getByText("Cargá tu primer cliente")).toBeInTheDocument()
    expect(screen.getByText("Creá un proyecto")).toBeInTheDocument()
    expect(screen.getByText("Registrá un cobro")).toBeInTheDocument()
    expect(screen.queryAllByLabelText(/completado/i)).toHaveLength(0)
  })

  it("marks the payment step as done when hasPayments is true (triangulation: independent step)", () => {
    renderChecklist({ hasClients: false, hasProjects: false, hasPayments: true })

    expect(screen.getByText("Registrá un cobro")).toBeInTheDocument()
    expect(screen.getAllByLabelText(/completado/i)).toHaveLength(1)
  })

  it("does not render at all once the user has at least one client (graduated past onboarding)", () => {
    renderChecklist({ hasClients: true, hasProjects: false, hasPayments: false })

    expect(screen.queryByText("Empezá en 3 pasos")).not.toBeInTheDocument()
  })

  it("does not render when all three steps are already done", () => {
    renderChecklist({ hasClients: true, hasProjects: true, hasPayments: true })

    expect(screen.queryByText("Empezá en 3 pasos")).not.toBeInTheDocument()
  })

  it("navigates to /clients when the first step is clicked", async () => {
    const user = userEvent.setup()
    renderChecklist({ hasClients: false, hasProjects: false, hasPayments: false })

    await user.click(screen.getByRole("button", { name: /Cargá tu primer cliente/i }))

    expect(await screen.findByText("Clients Page Mock")).toBeInTheDocument()
  })

  it("dismisses the card, persists it to localStorage, and does not re-render", async () => {
    const user = userEvent.setup()
    renderChecklist({ hasClients: false, hasProjects: false, hasPayments: false })

    await user.click(screen.getByRole("button", { name: /Cerrar/i }))

    expect(screen.queryByText("Empezá en 3 pasos")).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true")
  })

  it("does not render at all when previously dismissed (triangulation: persisted across mounts)", () => {
    localStorage.setItem(STORAGE_KEY, "true")

    renderChecklist({ hasClients: false, hasProjects: false, hasPayments: false })

    expect(screen.queryByText("Empezá en 3 pasos")).not.toBeInTheDocument()
  })
})
