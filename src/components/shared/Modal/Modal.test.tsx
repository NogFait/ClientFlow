import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Modal from "./Modal"

describe("Modal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Detalle">
        <p>Contenido</p>
      </Modal>,
    )

    expect(screen.queryByText("Contenido")).not.toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders with dialog a11y attributes wired to the title", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Detalle del Cliente">
        <p>Contenido</p>
      </Modal>,
    )

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    const labelledBy = dialog.getAttribute("aria-labelledby")
    expect(labelledBy).toBeTruthy()
    expect(document.getElementById(labelledBy!)).toHaveTextContent("Detalle del Cliente")
  })

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Detalle">
        <p>Contenido</p>
      </Modal>,
    )

    await user.click(screen.getByRole("button", { name: /cerrar/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Detalle">
        <p>Contenido</p>
      </Modal>,
    )

    await user.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when the backdrop is clicked (triangulation: not when content is clicked)", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Detalle">
        <p>Contenido</p>
      </Modal>,
    )

    await user.click(screen.getByText("Contenido"))
    expect(onClose).not.toHaveBeenCalled()

    // The overlay is the dialog's parent — click it directly to simulate a
    // backdrop click outside the dialog surface.
    const dialog = screen.getByRole("dialog")
    await user.click(dialog.parentElement!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("moves focus into the dialog when opened", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Detalle">
        <p>Contenido</p>
      </Modal>,
    )

    expect(screen.getByRole("dialog")).toHaveFocus()
  })
})
