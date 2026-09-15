import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ConfirmDialog from "./ConfirmDialog"

describe("ConfirmDialog", () => {
  it("does not render when open is false", () => {
    render(
      <ConfirmDialog open={false} title="¿Eliminar a Juan?" onConfirm={() => {}} onCancel={() => {}} />,
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders the title, description and default labels", () => {
    render(
      <ConfirmDialog
        open
        title="¿Eliminar a Juan?"
        description="Esta acción no se puede deshacer."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByText("¿Eliminar a Juan?")).toBeInTheDocument()
    expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument()
  })

  it("calls onConfirm when the confirm button is clicked", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog open title="¿Eliminar?" onConfirm={onConfirm} onCancel={() => {}} />,
    )

    await user.click(screen.getByRole("button", { name: "Eliminar" }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("calls onCancel when the cancel button is clicked (triangulation: distinct handler)", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open title="¿Eliminar?" onConfirm={() => {}} onCancel={onCancel} />,
    )

    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("calls onCancel when Escape is pressed", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open title="¿Eliminar?" onConfirm={() => {}} onCancel={onCancel} />,
    )

    await user.keyboard("{Escape}")

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("gives the confirm button initial focus", () => {
    render(
      <ConfirmDialog open title="¿Eliminar?" onConfirm={() => {}} onCancel={() => {}} />,
    )

    expect(screen.getByRole("button", { name: "Eliminar" })).toHaveFocus()
  })

  it("supports custom labels and non-danger styling", () => {
    render(
      <ConfirmDialog
        open
        title="¿Confirmar?"
        confirmLabel="Sí, continuar"
        cancelLabel="No"
        danger={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByRole("button", { name: "Sí, continuar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument()
  })

  it("disables the confirm button and shows loading state when loading", () => {
    render(
      <ConfirmDialog open title="¿Eliminar?" loading onConfirm={() => {}} onCancel={() => {}} />,
    )

    expect(screen.getByRole("button", { name: /eliminando/i })).toBeDisabled()
  })
})
