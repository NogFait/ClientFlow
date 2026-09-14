export type HeaderBag = Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Derives the app's public origin from the request itself (design §3
// deviation, api/_lib/env.ts) instead of a dedicated APP_URL env var —
// avoids a config value that has to be kept in sync with wherever the app is
// actually deployed (production domain, a Vercel preview URL, `vercel dev`).
export function resolveAppOrigin(headers: HeaderBag): string {
  const origin = firstValue(headers.origin)
  if (origin) return origin

  const forwardedHost = firstValue(headers["x-forwarded-host"])
  if (forwardedHost) {
    const proto = firstValue(headers["x-forwarded-proto"]) ?? "https"
    return `${proto}://${forwardedHost}`
  }

  throw new Error("Cannot resolve app origin: no Origin or x-forwarded-host header present")
}
