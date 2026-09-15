import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import TaskForm from "./TaskForm"
import type { ITask } from "../../types"
import type { IProject } from "../../../projects/types"

const projects: IProject[] = [{ id: "p1", name: "Sitio Web", status: "activo" }]

function Harness({ lockedProjectId }: { lockedProjectId?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ITask>()
  return (
    <TaskForm
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

describe("TaskForm — lockedProjectId", () => {
  it("hides the project select when a project is locked (hub context)", () => {
    render(<Harness lockedProjectId="p1" />)

    expect(screen.queryByLabelText("Proyecto")).not.toBeInTheDocument()
  })

  it("shows the project select when no project is locked (unchanged TaskPage behavior, triangulation)", () => {
    render(<Harness />)

    expect(screen.getByLabelText("Proyecto")).toBeInTheDocument()
  })
})

describe("TaskForm — every field is reachable via its label", () => {
  it("associates all labels with their inputs via htmlFor/id", () => {
    render(<Harness />)

    expect(screen.getByLabelText("Título")).toBeInTheDocument()
    expect(screen.getByLabelText("Descripción")).toBeInTheDocument()
    expect(screen.getByLabelText("Proyecto")).toBeInTheDocument()
    expect(screen.getByLabelText("Estado")).toBeInTheDocument()
    expect(screen.getByLabelText("Prioridad")).toBeInTheDocument()
    expect(screen.getByLabelText("Fecha límite")).toBeInTheDocument()
  })

  it("uses a unique id per instance so two mounted forms don't collide (triangulation)", () => {
    render(
      <>
        <Harness />
        <Harness />
      </>,
    )

    const titleInputs = screen.getAllByLabelText("Título")
    expect(titleInputs).toHaveLength(2)
    expect(titleInputs[0].id).not.toBe(titleInputs[1].id)
  })
})

describe("TaskForm — error accessibility", () => {
  function HarnessWithTitleError() {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<ITask>()
    return (
      <TaskForm
        register={register}
        handleSubmit={handleSubmit}
        onSubmit={async () => {}}
        errors={{ title: { type: "required", message: "Requerido" } } as never}
        isSubmitting={isSubmitting}
        onCancel={vi.fn()}
        projects={projects}
      />
    )
  }

  it("marks the Título input as invalid and describes it with the error message", () => {
    render(<HarnessWithTitleError />)

    const input = screen.getByLabelText("Título")
    expect(input).toHaveAttribute("aria-invalid", "true")
    const describedBy = input.getAttribute("aria-describedby")
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)).toHaveTextContent("Requerido")
  })
})
