import { beforeEach, describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import LanguageSwitch from "./LanguageSwitch"
import { createI18n } from "../../../i18n/createI18n"
import { LANG_STORAGE_KEY } from "../../../i18n/preference"
import type { Lang } from "../../../i18n"

function LocationProbe() {
  const { pathname, search, hash } = useLocation()
  return <div data-testid="location">{`${pathname}${search}${hash}`}</div>
}

function renderRouteMode(initialEntry: string, lang: Lang = "es") {
  const i18n = createI18n(lang)
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <LanguageSwitch mode="route" />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  )
  return i18n
}

beforeEach(() => {
  window.localStorage.clear()
})

describe("LanguageSwitch — accessibility", () => {
  it("is a labelled group of two buttons with the current language pressed", () => {
    renderRouteMode("/pricing", "es")

    const group = screen.getByRole("group", { name: "Idioma" })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "false")
  })

  it("labels the group in the current language and presses EN when rendering in English (triangulation)", () => {
    renderRouteMode("/en/pricing", "en")

    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true")
  })

  it("is keyboard operable: Tab to the other language and Enter activates it", async () => {
    const user = userEvent.setup()
    renderRouteMode("/pricing", "es")

    await user.tab()
    await user.tab()
    expect(screen.getByRole("button", { name: "English" })).toHaveFocus()
    await user.keyboard("{Enter}")

    expect(screen.getByTestId("location")).toHaveTextContent("/en/pricing")
  })
})

describe("LanguageSwitch — mode='route'", () => {
  it("navigates to the English counterpart of the current path and stores the preference", async () => {
    const user = userEvent.setup()
    renderRouteMode("/pricing", "es")

    await user.click(screen.getByRole("button", { name: "English" }))

    expect(screen.getByTestId("location")).toHaveTextContent("/en/pricing")
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en")
  })

  it("navigates back to the Spanish path from an English one (triangulation: other direction)", async () => {
    const user = userEvent.setup()
    renderRouteMode("/en", "en")

    await user.click(screen.getByRole("button", { name: "Español" }))

    expect(screen.getByTestId("location")).toHaveTextContent("/")
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("es")
  })

  it("preserves the hash and query string across the switch (/#precios → /en#precios)", async () => {
    const user = userEvent.setup()
    renderRouteMode("/?ref=x#precios", "es")

    await user.click(screen.getByRole("button", { name: "English" }))

    expect(screen.getByTestId("location")).toHaveTextContent("/en?ref=x#precios")
  })

  it("does nothing when the current language is clicked again", async () => {
    const user = userEvent.setup()
    renderRouteMode("/pricing", "es")

    await user.click(screen.getByRole("button", { name: "Español" }))

    expect(screen.getByTestId("location")).toHaveTextContent("/pricing")
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBeNull()
  })

  it("on a page with no localized counterpart (the blog) switches the language in place and stays on the URL", async () => {
    const user = userEvent.setup()
    renderRouteMode("/blog/un-post", "es")

    await user.click(screen.getByRole("button", { name: "English" }))

    expect(screen.getByTestId("location")).toHaveTextContent("/blog/un-post")
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true")
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en")
  })
})

describe("LanguageSwitch — mode='preference'", () => {
  it("stores the preference and switches the i18n instance's language without navigating", async () => {
    const user = userEvent.setup()
    const i18n = createI18n("es")
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/login"]}>
          <LanguageSwitch mode="preference" />
          <LocationProbe />
        </MemoryRouter>
      </I18nextProvider>,
    )

    await user.click(screen.getByRole("button", { name: "English" }))

    expect(i18n.language).toBe("en")
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en")
    expect(screen.getByTestId("location")).toHaveTextContent("/login")
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true")
  })
})
