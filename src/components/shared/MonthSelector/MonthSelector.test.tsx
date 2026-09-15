import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MonthSelector from "./MonthSelector"
import { currentMonthKey, shiftMonth } from "../../../utils/month"

describe("MonthSelector", () => {
  it("renders the formatted month label with aria-live polite", () => {
    render(<MonthSelector value="2026-09" onChange={() => {}} />)

    const label = screen.getByText("Septiembre 2026")
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute("aria-live", "polite")
  })

  it("calls onChange with the previous month when the prev button is clicked", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MonthSelector value="2026-09" onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "Mes anterior" }))

    expect(onChange).toHaveBeenCalledWith("2026-08")
  })

  it("calls onChange with the next month when the next button is clicked (triangulation: opposite direction)", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MonthSelector value="2026-09" onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "Mes siguiente" }))

    expect(onChange).toHaveBeenCalledWith("2026-10")
  })

  it("disables the next button once value reaches max", () => {
    render(<MonthSelector value="2026-09" onChange={() => {}} max="2026-09" />)

    expect(screen.getByRole("button", { name: "Mes siguiente" })).toBeDisabled()
  })

  it("keeps the next button enabled below max (triangulation)", () => {
    render(<MonthSelector value="2026-08" onChange={() => {}} max="2026-09" />)

    expect(screen.getByRole("button", { name: "Mes siguiente" })).toBeEnabled()
  })

  it("disables the 'Hoy' button when value is already the current month", () => {
    render(<MonthSelector value={currentMonthKey()} onChange={() => {}} />)

    expect(screen.getByRole("button", { name: "Hoy" })).toBeDisabled()
  })

  it("resets to the current month when 'Hoy' is clicked from a past month", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const pastMonth = shiftMonth(currentMonthKey(), -3)
    render(<MonthSelector value={pastMonth} onChange={onChange} />)

    const today = screen.getByRole("button", { name: "Hoy" })
    expect(today).toBeEnabled()
    await user.click(today)

    expect(onChange).toHaveBeenCalledWith(currentMonthKey())
  })

  it("shifts the month with ArrowLeft/ArrowRight on the selector group", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MonthSelector value="2026-09" onChange={onChange} />)

    screen.getByRole("group", { name: "Selector de mes" }).focus()
    await user.keyboard("{ArrowLeft}")
    expect(onChange).toHaveBeenLastCalledWith("2026-08")

    await user.keyboard("{ArrowRight}")
    expect(onChange).toHaveBeenLastCalledWith("2026-10")
  })

  it("does not shift past max with ArrowRight (triangulation: keyboard respects max)", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MonthSelector value="2026-09" onChange={onChange} max="2026-09" />)

    screen.getByRole("group", { name: "Selector de mes" }).focus()
    await user.keyboard("{ArrowRight}")

    expect(onChange).not.toHaveBeenCalled()
  })
})
