import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import WeeklyDigestToggle from "./WeeklyDigestToggle"

const getUserSettingsMock = vi.fn()
const setWeeklyDigestMock = vi.fn()
vi.mock("../../services", () => ({
  getUserSettings: () => getUserSettingsMock(),
  setWeeklyDigest: (v: boolean) => setWeeklyDigestMock(v),
}))

beforeEach(() => {
  getUserSettingsMock.mockResolvedValue({ weekly_digest: true })
  setWeeklyDigestMock.mockResolvedValue(undefined)
})
afterEach(() => {
  getUserSettingsMock.mockReset()
  setWeeklyDigestMock.mockReset()
})

describe("WeeklyDigestToggle", () => {
  it("shows the stored preference as a labelled switch", async () => {
    getUserSettingsMock.mockResolvedValue({ weekly_digest: false })
    render(<WeeklyDigestToggle />)

    const toggle = await screen.findByRole("switch", { name: /Resumen semanal por email/i })
    expect(toggle).toHaveAttribute("aria-checked", "false")
    expect(screen.getByText(/Todos los lunes/i)).toBeInTheDocument()
  })

  it("saves the new value when toggled and reflects it", async () => {
    const user = userEvent.setup()
    render(<WeeklyDigestToggle />)
    const toggle = await screen.findByRole("switch", { name: /Resumen semanal por email/i })
    expect(toggle).toHaveAttribute("aria-checked", "true")

    await user.click(toggle)

    await waitFor(() => expect(setWeeklyDigestMock).toHaveBeenCalledWith(false))
    expect(toggle).toHaveAttribute("aria-checked", "false")
  })

  it("reverts and shows an error when saving fails", async () => {
    setWeeklyDigestMock.mockRejectedValue(new Error("nope"))
    const user = userEvent.setup()
    render(<WeeklyDigestToggle />)
    const toggle = await screen.findByRole("switch", { name: /Resumen semanal por email/i })

    await user.click(toggle)

    expect(await screen.findByText(/No pudimos guardar/i)).toBeInTheDocument()
    expect(toggle).toHaveAttribute("aria-checked", "true")
  })
})

describe("WeeklyDigestToggle — compact (page header)", () => {
  it("renders just the label and the switch, no card copy, and still saves", async () => {
    const user = userEvent.setup()
    render(<WeeklyDigestToggle variant="compact" />)

    const toggle = await screen.findByRole("switch", { name: /Resumen semanal por email/i })
    expect(screen.getByText("Resumen semanal por email")).toBeInTheDocument()
    expect(screen.queryByText(/Todos los lunes/i)).not.toBeInTheDocument()

    await user.click(toggle)
    await waitFor(() => expect(setWeeklyDigestMock).toHaveBeenCalledWith(false))
  })
})
