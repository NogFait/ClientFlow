import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import PainPoints from "./PainPoints"

// The audit's "¿Te pasa esto?" section: name the scattered tools a freelancer
// already uses so the visitor recognises themselves before the pitch.
describe("PainPoints", () => {
  it("names the four tools freelancers scatter their work across", () => {
    render(<PainPoints />)

    expect(screen.getByRole("heading", { level: 2, name: /¿te pasa esto\?/i })).toBeInTheDocument()
    const tools = screen.getAllByTestId("pain-tool").map((el) => el.textContent)
    expect(tools).toEqual(["WhatsApp", "Excel", "Notion o Trello", "Calendario"])
  })
})
