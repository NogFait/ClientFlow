import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'

// Vercel Analytics lives in the CLIENT entry only: it's a browser-side
// beacon (page views + referrers, cookieless), so it has no place in the
// prerendered HTML and rendering it during SSR would only risk a hydration
// mismatch. It also auto-disables itself outside Vercel deployments.
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Analytics />
  </StrictMode>
)

const container = document.getElementById('root')!

// The public routes (/, /pricing, /terms, /privacy) ship prerendered markup
// inside #root (scripts/prerender.mjs), so React must adopt that DOM instead
// of throwing it away; every other route is served the empty app.html shell
// and mounts from scratch. Same App/BrowserRouter tree either way — only the
// mounting call differs.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
