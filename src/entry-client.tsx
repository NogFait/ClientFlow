import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import { createI18n } from './i18n/createI18n'
import { resolveInitialLang } from './i18n/paths'
import { getStoredLang } from './i18n/preference'

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
