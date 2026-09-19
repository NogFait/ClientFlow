import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Login from "./Login"
import { renderWithLang } from "../../../test/i18n"
import { LANG_STORAGE_KEY } from "../../../i18n/preference"

vi.mock("../../../services/supabaseClient", () => ({
  supabase: { auth: { signInWithPassword: vi.fn() } },
}))

beforeEach(() => {
  window.localStorage.clear()
})

describe("Login — language preference", () => {
  it("shows the ES|EN switch and switches the form to English in place, remembering the choice", async () => {
    const user = userEvent.setup()
    renderWithLang(<Login />, "es", { initialEntries: ["/login"] })

    expect(screen.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "English" }))

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument()
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en")
  })

  it("applies a stored English preference on mount even when the instance starts in Spanish (preference wins)", () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, "en")
    renderWithLang(<Login />, "es", { initialEntries: ["/login"] })

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument()
  })

  it("keeps the current language when nothing was ever stored (a visitor arriving from /en stays in English)", () => {
    renderWithLang(<Login />, "en", { initialEntries: ["/login"] })

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument()
  })
})

describe("Login — brand link keeps the chosen language", () => {
  it("points the ClientFlow logo to /en when the UI is in English", () => {
    renderWithLang(<Login />, "en", { initialEntries: ["/login"] })
    expect(screen.getByRole("link", { name: /ClientFlow/i })).toHaveAttribute("href", "/en")
  })

  it("points it to / in Spanish (triangulation)", () => {
    renderWithLang(<Login />, "es", { initialEntries: ["/login"] })
    expect(screen.getByRole("link", { name: /ClientFlow/i })).toHaveAttribute("href", "/")
  })
})
