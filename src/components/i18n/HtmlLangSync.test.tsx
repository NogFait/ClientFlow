import { afterEach, describe, expect, it } from "vitest"
import { act, render } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import HtmlLangSync from "./HtmlLangSync"
import { createI18n } from "../../i18n/createI18n"

afterEach(() => {
  document.documentElement.lang = ""
})

describe("HtmlLangSync", () => {
  it("sets <html lang> to the instance's language on mount and follows changeLanguage", async () => {
    const i18n = createI18n("en")
    render(
      <I18nextProvider i18n={i18n}>
        <HtmlLangSync />
      </I18nextProvider>,
    )

    expect(document.documentElement.lang).toBe("en")

    await act(async () => {
      await i18n.changeLanguage("es")
    })

    expect(document.documentElement.lang).toBe("es")
  })
})
