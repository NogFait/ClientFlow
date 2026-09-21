import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ClientNotes from "./ClientNotes"

const getClientNotesMock = vi.fn()
const createClientNoteMock = vi.fn()
const deleteClientNoteMock = vi.fn()

vi.mock("../../services", () => ({
  getClientNotes: (id: string) => getClientNotesMock(id),
  createClientNote: (note: unknown) => createClientNoteMock(note),
  deleteClientNote: (id: string) => deleteClientNoteMock(id),
}))

const notes = [
  { id: "n2", client_id: "c1", note_date: "2026-09-15", content: "Quedé en escribirle el 15" },
  { id: "n1", client_id: "c1", note_date: "2026-09-03", content: "Le pasé presupuesto" },
]

beforeEach(() => {
  getClientNotesMock.mockResolvedValue(notes)
  createClientNoteMock.mockReset()
  deleteClientNoteMock.mockReset()
})

afterEach(() => {
  getClientNotesMock.mockReset()
})

describe("ClientNotes — list", () => {
  it("loads the client's notes and shows them newest first with their calendar date", async () => {
    render(<ClientNotes clientId="c1" />)

    const items = await screen.findAllByRole("listitem")
    expect(getClientNotesMock).toHaveBeenCalledWith("c1")
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText("Quedé en escribirle el 15")).toBeInTheDocument()
    expect(within(items[0]).getByText("15/9/2026")).toBeInTheDocument()
    expect(within(items[1]).getByText("Le pasé presupuesto")).toBeInTheDocument()
    expect(within(items[1]).getByText("3/9/2026")).toBeInTheDocument()
  })

  it("explains what the history is for when there are no notes yet", async () => {
    getClientNotesMock.mockResolvedValue([])
    render(<ClientNotes clientId="c1" />)

    expect(await screen.findByText(/Todavía no hay notas/i)).toBeInTheDocument()
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument()
  })

  it("shows an error instead of an empty history when loading fails (triangulation)", async () => {
    getClientNotesMock.mockRejectedValue(new Error("network down"))
    render(<ClientNotes clientId="c1" />)

    expect(await screen.findByText(/No pudimos cargar el historial/i)).toBeInTheDocument()
    expect(screen.queryByText(/Todavía no hay notas/i)).not.toBeInTheDocument()
  })
})

describe("ClientNotes — add", () => {
  it("defaults the date to today and adds the note to the top of the list, clearing the text", async () => {
    const stored = { id: "n3", client_id: "c1", note_date: "2026-09-19", content: "Llamé, no atendió" }
    createClientNoteMock.mockResolvedValue(stored)
    const user = userEvent.setup()
    render(<ClientNotes clientId="c1" />)
    await screen.findAllByRole("listitem")

    const date = screen.getByLabelText(/^Fecha$/i) as HTMLInputElement
    expect(date.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    await user.clear(date)
    await user.type(date, "2026-09-19")
    const text = screen.getByLabelText(/^Nota$/i)
    await user.type(text, "  Llamé, no atendió  ")
    await user.click(screen.getByRole("button", { name: /Agregar nota/i }))

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3))
    expect(createClientNoteMock).toHaveBeenCalledWith({ client_id: "c1", note_date: "2026-09-19", content: "Llamé, no atendió" })
    expect(within(screen.getAllByRole("listitem")[0]).getByText("Llamé, no atendió")).toBeInTheDocument()
    expect((screen.getByLabelText(/^Nota$/i) as HTMLTextAreaElement).value).toBe("")
  })

  it("refuses a blank note without calling the service", async () => {
    const user = userEvent.setup()
    render(<ClientNotes clientId="c1" />)
    await screen.findAllByRole("listitem")

    await user.type(screen.getByLabelText(/^Nota$/i), "   ")
    await user.click(screen.getByRole("button", { name: /Agregar nota/i }))

    expect(await screen.findByText(/Escribí algo/i)).toBeInTheDocument()
    expect(createClientNoteMock).not.toHaveBeenCalled()
  })

  it("keeps the text and shows the error when saving fails (triangulation)", async () => {
    createClientNoteMock.mockRejectedValue(new Error("violates check constraint"))
    const user = userEvent.setup()
    render(<ClientNotes clientId="c1" />)
    await screen.findAllByRole("listitem")

    await user.type(screen.getByLabelText(/^Nota$/i), "Algo")
    await user.click(screen.getByRole("button", { name: /Agregar nota/i }))

    expect(await screen.findByText(/No pudimos guardar la nota/i)).toBeInTheDocument()
    expect((screen.getByLabelText(/^Nota$/i) as HTMLTextAreaElement).value).toBe("Algo")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })
})

describe("ClientNotes — delete", () => {
  it("asks inline before deleting and does nothing until confirmed", async () => {
    const user = userEvent.setup()
    render(<ClientNotes clientId="c1" />)
    const [first] = await screen.findAllByRole("listitem")

    await user.click(within(first).getByRole("button", { name: /Eliminar/i }))

    expect(within(first).getByText(/¿Eliminar esta nota\?/i)).toBeInTheDocument()
    expect(deleteClientNoteMock).not.toHaveBeenCalled()

    await user.click(within(first).getByRole("button", { name: /^No$/i }))
    expect(within(first).queryByText(/¿Eliminar esta nota\?/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })

  it("deletes the note and removes it from the list once confirmed", async () => {
    deleteClientNoteMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ClientNotes clientId="c1" />)
    const [first] = await screen.findAllByRole("listitem")

    await user.click(within(first).getByRole("button", { name: /Eliminar/i }))
    await user.click(within(first).getByRole("button", { name: /^Sí$/i }))

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1))
    expect(deleteClientNoteMock).toHaveBeenCalledWith("n2")
    expect(screen.queryByText("Quedé en escribirle el 15")).not.toBeInTheDocument()
  })
})
