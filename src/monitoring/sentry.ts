import * as Sentry from "@sentry/react"

interface MonitoringOptions {
  /** Sentry DSN — public by design (it ships in the bundle). Absent → no-op. */
  dsn: string | undefined
  /** "production" | "preview" | "development" — filters issues in Sentry. */
  environment: string
}

// Error monitoring (Sentry), client-only — called once from entry-client
// before the first render. Errors only, no tracing or session replay: on
// the free plan that keeps the quota for what matters, and replay would
// record client names and amounts on screen. Data collection is spelled
// out (not `sendDefaultPii`, deprecated in v10): no user info/IP, and no
// cookies, headers, bodies or query strings — Supabase responses carry the
// user's clients and payments. The stack trace and the URL path are enough.
export function initMonitoring({ dsn, environment }: MonitoringOptions) {
  // Vercel exposes unset variables as "" — treat that as "not configured".
  if (!dsn) return

  Sentry.init({
    dsn,
    environment,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
    // Release is injected at build time by @sentry/vite-plugin (SENTRY_RELEASE
    // global) so source maps match — nothing to set here.
    tracesSampleRate: 0,
    ignoreErrors: [
      // Browser-extension and network noise that never comes from our code.
      /ResizeObserver loop/i,
      /Failed to fetch dynamically imported module/i,
      /Load failed/i,
    ],
  })
}

interface ReactErrorInfo {
  componentStack: string
}

// What the ErrorBoundary calls: the error plus React's component stack, so
// the issue shows which tree crashed, not just the throwing function.
export function reportError(error: unknown, info: ReactErrorInfo) {
  Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } })
}
