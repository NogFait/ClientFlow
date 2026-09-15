import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Faq from "./Faq"

const items = [
  { question: "Pregunta uno", answer: "Respuesta uno" },
  { question: "Pregunta dos", answer: "Respuesta dos" },
  { question: "Pregunta tres", answer: "Respuesta tres" },
]

describe("Faq", () => {
  it("opens the first item by default and keeps the rest collapsed", () => {
    render(<Faq items={items} />)

    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true")
    expect(buttons[1]).toHaveAttribute("aria-expanded", "false")
    expect(buttons[2]).toHaveAttribute("aria-expanded", "false")
  })

  it("opens a different item on click and closes the previously open one (triangulation: accordion, single-open)", async () => {
    const user = userEvent.setup()
    render(<Faq items={items} />)

    const buttons = screen.getAllByRole("button")
    await user.click(buttons[1])

    expect(buttons[1]).toHaveAttribute("aria-expanded", "true")
    expect(buttons[0]).toHaveAttribute("aria-expanded", "false")
  })

  it("closes the open item when its own question is clicked again (triangulation: toggle closed)", async () => {
    const user = userEvent.setup()
    render(<Faq items={items} />)

    const buttons = screen.getAllByRole("button")
    await user.click(buttons[0])

    expect(buttons[0]).toHaveAttribute("aria-expanded", "false")
  })

  it("links each question button to its answer region via aria-controls/aria-labelledby", () => {
    render(<Faq items={items} />)

    const buttons = screen.getAllByRole("button")
    const regions = screen.getAllByRole("region")
    const controlsId = buttons[0].getAttribute("aria-controls")

    expect(controlsId).toBeTruthy()
    expect(regions[0]).toHaveAttribute("id", controlsId)
    expect(regions[0]).toHaveTextContent("Respuesta uno")
  })
})
