import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { ComponentProps } from "react"
import type SidebarComponent from "./Sidebar"

const STORAGE_KEY = "clientflow.sidebar.collapsed"

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.doUnmock("../../../config/features")
  vi.resetModules()
})

function installMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia
}

async function renderSidebar(props: ComponentProps<typeof SidebarComponent> = {}) {
  const { default: Sidebar } = await import("./Sidebar")
  render(
    <MemoryRouter>
      <Sidebar {...props} />
    </MemoryRouter>,
  )
}

describe("Sidebar — billing nav entry", () => {
  it("shows 'Plan y facturación' linking to /settings/billing when billing is enabled", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: true }))

    await renderSidebar()

    const link = screen.getByRole("link", { name: /Plan y facturación/i })
    expect(link).toHaveAttribute("href", "/settings/billing")
  })

  it("hides the billing nav entry when billing is disabled (triangulation)", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: false }))

    await renderSidebar()

    expect(screen.queryByRole("link", { name: /Plan y facturación/i })).not.toBeInTheDocument()
    // Pre-existing nav items are unaffected by the flag.
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument()
  })
})

describe("Sidebar — desktop collapse", () => {
  beforeEach(() => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: false }))
  })

  it("toggling the collapse button flips its label from 'Colapsar' to 'Expandir' and persists it", async () => {
    const user = userEvent.setup()
    await renderSidebar()

    const toggle = screen.getByRole("button", { name: /Colapsar sidebar/i })
    await user.click(toggle)

    expect(screen.getByRole("button", { name: /Expandir sidebar/i })).toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true")
  })

  it("starts collapsed when a previous session persisted collapsed=true (triangulation)", async () => {
    window.localStorage.setItem(STORAGE_KEY, "true")

    await renderSidebar()

    expect(screen.getByRole("button", { name: /Expandir sidebar/i })).toBeInTheDocument()
  })
})

describe("Sidebar — mobile drawer", () => {
  beforeEach(() => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: false }))
    installMatchMedia(true)
  })

  it("is not exposed as a dialog when closed", async () => {
    await renderSidebar({ mobileOpen: false, onCloseMobile: vi.fn() })

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders as a modal dialog with a backdrop when open, and closes on backdrop click", async () => {
    const user = userEvent.setup()
    const onCloseMobile = vi.fn()
    await renderSidebar({ mobileOpen: true, onCloseMobile })

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")

    await user.click(screen.getByTestId("sidebar-backdrop"))
    expect(onCloseMobile).toHaveBeenCalled()
  })

  it("closes on Escape when open (triangulation: keyboard dismissal)", async () => {
    const user = userEvent.setup()
    const onCloseMobile = vi.fn()
    await renderSidebar({ mobileOpen: true, onCloseMobile })

    await user.keyboard("{Escape}")

    expect(onCloseMobile).toHaveBeenCalled()
  })

  it("closes the drawer after navigating to a nav item (triangulation: navigation dismissal)", async () => {
    const user = userEvent.setup()
    const onCloseMobile = vi.fn()
    const { default: Sidebar } = await import("./Sidebar")
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="*" element={<Sidebar mobileOpen onCloseMobile={onCloseMobile} />} />
        </Routes>
      </MemoryRouter>,
    )
    onCloseMobile.mockClear()

    await user.click(screen.getByRole("link", { name: /Clientes/i }))

    expect(onCloseMobile).toHaveBeenCalled()
  })
})
