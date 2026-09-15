import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import PaymentForm from "./PaymentForm"
import type { IPayment } from "../../types"
import type { IProject } from "../../../projects/types"

const projects: IProject[] = [{ id: "p1", name: "Sitio Web", status: "activo" }]

function Harness({ lockedProjectId }: { lockedProjectId?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<IPayment>()
  return (
    <PaymentForm
      register={register}
      handleSubmit={handleSubmit}
      onSubmit={async () => {}}
      errors={errors}
      isSubmitting={isSubmitting}
      onCancel={vi.fn()}
      projects={projects}
      lockedProjectId={lockedProjectId}
    />
  )
}

describe("PaymentForm — lockedProjectId", () => {
  it("hides the project select when a project is locked (hub context)", () => {
    render(<Harness lockedProjectId="p1" />)

    expect(screen.queryByLabelText("Proyecto")).not.toBeInTheDocument()
  })

  it("shows the project select when no project is locked (unchanged PaymentsPage behavior, triangulation)", () => {
    render(<Harness />)

    expect(screen.getByLabelText("Proyecto")).toBeInTheDocument()
  })
})

describe("PaymentForm — every field is reachable via its label", () => {
  it("associates all labels with their inputs via htmlFor/id", () => {
    render(<Harness />)

    expect(screen.getByLabelText("Proyecto")).toBeInTheDocument()
    expect(screen.getByLabelText("Monto")).toBeInTheDocument()
    expect(screen.getByLabelText("Fecha de pago")).toBeInTheDocument()
    expect(screen.getByLabelText("Método")).toBeInTheDocument()
    expect(screen.getByLabelText("Estado")).toBeInTheDocument()
    expect(screen.getByLabelText("Notas")).toBeInTheDocument()
  })

  it("uses a unique id per instance so two mounted forms don't collide (triangulation)", () => {
    render(
      <>
        <Harness />
        <Harness />
      </>,
    )

    const amountInputs = screen.getAllByLabelText("Monto")
    expect(amountInputs).toHaveLength(2)
    expect(amountInputs[0].id).not.toBe(amountInputs[1].id)
  })
})

describe("PaymentForm — error accessibility", () => {
  function HarnessWithAmountError() {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<IPayment>()
    return (
      <PaymentForm
        register={register}
        handleSubmit={handleSubmit}
        onSubmit={async () => {}}
        errors={{ amount: { type: "required", message: "Requerido" } } as never}
        isSubmitting={isSubmitting}
        onCancel={vi.fn()}
        projects={projects}
      />
    )
  }

  it("marks the Monto input as invalid and describes it with the error message", () => {
    render(<HarnessWithAmountError />)

    const input = screen.getByLabelText("Monto")
    expect(input).toHaveAttribute("aria-invalid", "true")
    const describedBy = input.getAttribute("aria-describedby")
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)).toHaveTextContent("Requerido")
  })
})
