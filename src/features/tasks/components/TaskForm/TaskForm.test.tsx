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
