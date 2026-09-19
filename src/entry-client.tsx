import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import { createI18n } from './i18n/createI18n'
import { resolveInitialLang } from './i18n/paths'
import { getStoredLang } from './i18n/preference'
import { initMonitoring } from './monitoring/sentry'

// Error monitoring first, so anything that throws from here on is reported.
// Client entry only: it's a browser SDK and the prerender never runs it.
// No-op without VITE_SENTRY_DSN (local dev, tests). VITE_VERCEL_ENV is
// "production" | "preview" | "development" when Vercel's system env vars
// are exposed to the build; MODE covers everything else.
initMonitoring({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_VERCEL_ENV ?? import.meta.env.MODE,
})

// One i18n instance for the life of the page. Its language is decided
// BEFORE the first render, from the URL (so hydrating /en adopts English
// markup with English markup — a mismatch here would make React throw the
// prerendered DOM away) or, on routes without a URL language, from the
// stored preference.
const i18n = createI18n(resolveInitialLang(window.location.pathname, getStoredLang()))

// Vercel Analytics lives in the CLIENT entry only: it's a browser-side
// beacon (page views + referrers, cookieless), so it has no place in the
// prerendered HTML and rendering it during SSR would only risk a hydration
// mismatch. It also auto-disables itself outside Vercel deployments.
const app = (
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nextProvider>
    <Analytics />
  </StrictMode>
)

const container = document.getElementById('root')!

// The public routes (/, /pricing, /terms, /privacy and their /en twins) ship prerendered markup
// inside #root (scripts/prerender.mjs), so React must adopt that DOM instead
// of throwing it away; every other route is served the empty app.html shell
// and mounts from scratch. Same App/BrowserRouter tree either way — only the
// mounting call differs.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
