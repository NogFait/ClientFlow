import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import ClientForm from "./ClientForm"
import type { IClient } from "../../types"

function Harness() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<IClient>()
  return (
    <ClientForm
      register={register}
      handleSubmit={handleSubmit}
      onSubmit={async () => {}}
      errors={errors}
      isSubmitting={isSubmitting}
      onCancel={vi.fn()}
    />
  )
}

describe("ClientForm — every field is reachable via its label", () => {
  it("associates all labels with their inputs via htmlFor/id", () => {
    render(<Harness />)

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Celular")).toBeInTheDocument()
    expect(screen.getByLabelText("Empresa")).toBeInTheDocument()
    expect(screen.getByLabelText("Estado")).toBeInTheDocument()
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

describe("ClientForm — error accessibility", () => {
  function HarnessWithNameError() {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<IClient>()
    return (
      <ClientForm
        register={register}
        handleSubmit={handleSubmit}
        onSubmit={async () => {}}
        errors={{ name: { type: "required", message: "Requerido" } } as never}
        isSubmitting={isSubmitting}
        onCancel={vi.fn()}
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
