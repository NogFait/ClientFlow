import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { AuthProvider } from "./AuthProvider"
import { useAuthState } from "./authContext"

type FakeSession = { user: { id: string } } | null
type AuthChangeCallback = (event: string, session: FakeSession) => void

let authChangeCallback: AuthChangeCallback | null = null
const unsubscribeMock = vi.fn()
const getSessionMock = vi.fn()

vi.mock("../../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
      onAuthStateChange: (cb: AuthChangeCallback) => {
        authChangeCallback = cb
        return { data: { subscription: { unsubscribe: unsubscribeMock } } }
      },
    },
  },
}))

function Consumer() {
  const { status, user } = useAuthState()
  return <span data-testid="status">{`${status}:${user?.id ?? "none"}`}</span>
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  )
}

beforeEach(() => {
  authChangeCallback = null
  unsubscribeMock.mockReset()
  getSessionMock.mockReset().mockResolvedValue({ data: { session: null } })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("AuthProvider", () => {
  it("starts in loading status before session resolution", () => {
    renderProvider()

    expect(screen.getByTestId("status")).toHaveTextContent("loading:none")
  })

  it("transitions to anonymous once resolved with no session", async () => {
    renderProvider()

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous:none"))
  })

  it("transitions to authenticated when onAuthStateChange fires with a session (triangulation: different status/user)", async () => {
    renderProvider()
    await waitFor(() => expect(authChangeCallback).not.toBeNull())

    authChangeCallback!("SIGNED_IN", { user: { id: "user-1" } })

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authenticated:user-1"))
  })

  it("propagates a SIGNED_OUT event instantly after being authenticated", async () => {
    renderProvider()
    await waitFor(() => expect(authChangeCallback).not.toBeNull())
    authChangeCallback!("SIGNED_IN", { user: { id: "user-1" } })
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authenticated:user-1"))

    authChangeCallback!("SIGNED_OUT", null)

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous:none"))
  })

  it("unsubscribes from onAuthStateChange on unmount", () => {
    const { unmount } = renderProvider()

    unmount()

    expect(unsubscribeMock).toHaveBeenCalledTimes(1)
  })
})

describe("useAuthState", () => {
  it("throws a descriptive error when read outside an AuthProvider", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<Consumer />)).toThrow("useAuthState must be used within an AuthProvider")

    consoleErrorSpy.mockRestore()
  })
})
