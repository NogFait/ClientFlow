import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { renderWithLang } from "../../test/i18n"
import LandingPage from "./LandingPage"
import { resources } from "../../i18n/resources"

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => ({ hasSession: false, loading: false }),
}))

beforeEach(() => {
  document.title = ""
  document.head.querySelectorAll('link[rel="alternate"], meta[property="og:locale"]').forEach((el) => el.remove())
})

describe("LandingPage — English (/en)", () => {
  it("renders the English hero, sets the English title and English head alternates", () => {
    renderWithLang(<LandingPage />, "en", { initialEntries: ["/en"] })

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Your clients, projects and payments. In one place.",
    )
    expect(document.title).toBe("ClientFlow — CRM for freelancers")
    expect(document.head.querySelector('meta[property="og:locale"]')?.getAttribute("content")).toBe("en_US")
    expect(document.head.querySelector('link[rel="alternate"][hreflang="en"]')?.getAttribute("href")).toBe(
      "https://clientflow.lat/en",
    )
    expect(document.head.querySelector('link[rel="alternate"][hreflang="x-default"]')?.getAttribute("href")).toBe(
      "https://clientflow.lat/",
    )
  })

  it("renders every landing section in English (no Spanish copy leaks through)", () => {
    renderWithLang(<LandingPage />, "en", { initialEntries: ["/en"] })

    expect(screen.getByRole("heading", { name: /Sound familiar\?/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Three steps and you're organized\./i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Answers, not spreadsheets\./i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Start for free\. Pay when you grow\./i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /What people ask us before getting started\./i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Stop chasing payments from memory\./i })).toBeInTheDocument()
    expect(screen.queryByText(/Empezá gratis/)).not.toBeInTheDocument()
    expect(screen.queryByText(/¿Te pasa esto\?/)).not.toBeInTheDocument()
  })

  it("renders the English plan catalog and FAQ, and builds the FAQ JSON-LD from the English items", () => {
    renderWithLang(<LandingPage />, "en", { initialEntries: ["/en"] })

    expect(screen.getByRole("heading", { level: 3, name: "Pro yearly" })).toBeInTheDocument()
    expect(screen.getByText("2 months free")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Is it a sales CRM\?/i })).toHaveAttribute("aria-expanded", "true")

    const jsonLd = document.querySelector('script[type="application/ld+json"]')?.textContent ?? ""
    const parsed = JSON.parse(jsonLd) as { mainEntity: Array<{ name: string }> }
    expect(parsed.mainEntity.map((q) => q.name)).toEqual(resources.en.landing.faq.items.map((item) => item.question))
  })

  it("keeps the CTA links language-neutral (/register) and points the nav brand at /en", () => {
    renderWithLang(<LandingPage />, "en", { initialEntries: ["/en"] })

    expect(screen.getAllByRole("link", { name: /Start for free/i })[0]).toHaveAttribute("href", "/register")
    const brand = screen.getAllByRole("link").find((link) => link.textContent === "ClientFlow")
    expect(brand).toHaveAttribute("href", "/en")
  })
})
