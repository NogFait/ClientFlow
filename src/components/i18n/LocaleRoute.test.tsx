import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { I18nextProvider, useTranslation } from "react-i18next"
import LocaleRoute from "./LocaleRoute"
import { createI18n } from "../../i18n/createI18n"

function Probe() {
  const { t } = useTranslation()
  return <span data-testid="probe">{t("nav.login")}</span>
}

describe("LocaleRoute", () => {
  it("switches the instance to the route's language before the children are painted", () => {
    const i18n = createI18n("es")
    render(
      <I18nextProvider i18n={i18n}>
        <LocaleRoute lang="en">
          <Probe />
        </LocaleRoute>
      </I18nextProvider>,
    )

    expect(i18n.language).toBe("en")
    expect(screen.getByTestId("probe")).toHaveTextContent("Log in")
  })

  it("leaves the instance alone when it already matches (cold load of a prerendered page) (triangulation)", () => {
    const i18n = createI18n("es")
    render(
      <I18nextProvider i18n={i18n}>
        <LocaleRoute lang="es">
          <Probe />
        </LocaleRoute>
      </I18nextProvider>,
    )

    expect(i18n.language).toBe("es")
    expect(screen.getByTestId("probe")).toHaveTextContent("Iniciar sesión")
  })

  it("follows a prop change (client-side navigation between / and /en)", () => {
    const i18n = createI18n("es")
    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <LocaleRoute lang="es">
          <Probe />
        </LocaleRoute>
      </I18nextProvider>,
    )

    rerender(
      <I18nextProvider i18n={i18n}>
        <LocaleRoute lang="en">
          <Probe />
        </LocaleRoute>
      </I18nextProvider>,
    )

    expect(screen.getByTestId("probe")).toHaveTextContent("Log in")
  })
})
