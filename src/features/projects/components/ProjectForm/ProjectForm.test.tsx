import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import ProjectForm from "./ProjectForm"
import type { IProject } from "../../types"
import type { IClient } from "../../../clients/types"

const clients: IClient[] = [{ id: "c1", name: "Acme", email: "", celular: "", company: "", status: "activo" }]

function Harness() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<IProject>()
  return (
    <ProjectForm
      register={register}
      handleSubmit={handleSubmit}
      onSubmit={async () => {}}
      errors={errors}
      isSubmitting={isSubmitting}
      onCancel={vi.fn()}
      clients={clients}
    />
  )
}

describe("ProjectForm — every field is reachable via its label", () => {
  it("associates all labels with their inputs via htmlFor/id", () => {
    render(<Harness />)

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument()
    expect(screen.getByLabelText("Descripción")).toBeInTheDocument()
    expect(screen.getByLabelText("Cliente")).toBeInTheDocument()
    expect(screen.getByLabelText("Estado")).toBeInTheDocument()
    expect(screen.getByLabelText("Presupuesto")).toBeInTheDocument()
    expect(screen.getByLabelText("Fecha inicio")).toBeInTheDocument()
    expect(screen.getByLabelText("Fecha fin")).toBeInTheDocument()
  })

  it("uses a unique id per instance so two mounted forms don't collide (triangulation)", () => {
    render(
      <>
        <Harness />
        <Harness />
      </>,
    )

    const nameInputs = screen.getAllByLabelText("Nombre")
    expect(nameInputs).toHaveLength(2)
    expect(nameInputs[0].id).not.toBe(nameInputs[1].id)
  })
})

describe("ProjectForm — error accessibility", () => {
  function HarnessWithNameError() {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<IProject>()
    return (
      <ProjectForm
        register={register}
        handleSubmit={handleSubmit}
        onSubmit={async () => {}}
        errors={{ name: { type: "required", message: "Requerido" } } as never}
        isSubmitting={isSubmitting}
        onCancel={vi.fn()}
        clients={clients}
      />
    )
  }

  it("marks the Nombre input as invalid and describes it with the error message", () => {
    render(<HarnessWithNameError />)

    const input = screen.getByLabelText("Nombre")
    expect(input).toHaveAttribute("aria-invalid", "true")
    const describedBy = input.getAttribute("aria-describedby")
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)).toHaveTextContent("Requerido")
  })
})
