import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import ErrorBoundary from "./ErrorBoundary"

const reportErrorMock = vi.fn()
vi.mock("../../../monitoring/sentry", () => ({
  reportError: (...args: unknown[]) => reportErrorMock(...args),
}))

function Bomb(): never {
  throw new Error("kaboom")
}

describe("ErrorBoundary", () => {
  it("renders the fallback with a reload button instead of a white screen", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText("kaboom")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Recargar/i })).toBeInTheDocument()
  })

  it("reports the caught error to monitoring with the component stack", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(reportErrorMock).toHaveBeenCalledTimes(1)
    const [error, info] = reportErrorMock.mock.calls[0]
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe("kaboom")
    expect(info).toEqual({ componentStack: expect.stringContaining("Bomb") })
  })
})
