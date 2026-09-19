import { beforeEach, describe, expect, it, vi } from "vitest"

const initMock = vi.fn()
const captureExceptionMock = vi.fn()

vi.mock("@sentry/react", () => ({
  init: (...args: unknown[]) => initMock(...args),
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}))

beforeEach(() => {
  initMock.mockReset()
  captureExceptionMock.mockReset()
})

describe("initMonitoring", () => {
  it("does nothing without a DSN (local dev, tests, previews without the env var)", async () => {
    const { initMonitoring } = await import("./sentry")

    initMonitoring({ dsn: undefined, environment: "development" })

    expect(initMock).not.toHaveBeenCalled()
  })

  it("initialises Sentry with the DSN and environment, and no PII: no user info, cookies, headers, bodies or query params", async () => {
    const { initMonitoring } = await import("./sentry")

    initMonitoring({ dsn: "https://key@o1.ingest.us.sentry.io/1", environment: "production" })

    expect(initMock).toHaveBeenCalledTimes(1)
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://key@o1.ingest.us.sentry.io/1",
        environment: "production",
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
          stackFrameVariables: false,
        },
      }),
    )
  })

  it("treats an empty-string DSN as absent (Vercel exposes unset vars as '')", async () => {
    const { initMonitoring } = await import("./sentry")

    initMonitoring({ dsn: "", environment: "production" })

    expect(initMock).not.toHaveBeenCalled()
  })
})

describe("reportError", () => {
  it("forwards the error to Sentry with the React component stack as context", async () => {
    const { reportError } = await import("./sentry")
    const error = new Error("boom")

    reportError(error, { componentStack: "\n    at Dashboard" })

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      contexts: { react: { componentStack: "\n    at Dashboard" } },
    })
  })
})
