import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router-dom'
import App from './App.tsx'

// Build-time entry consumed by scripts/prerender.mjs (bundled with
// `vite build --ssr`). `prerender` — not renderToString — because the public
// routes other than "/" are React.lazy: it waits for every Suspense
// boundary to settle before resolving, so the HTML contains the real page
// rather than the `fallback={null}` placeholder.
export async function render(url: string): Promise<string> {
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  return readStream(prelude)
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let html = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
  }
  return html + decoder.decode()
}

// Re-exported so the prerender script gets everything it needs from the one
// SSR bundle — no second build, no TypeScript loader in Node.
export { PUBLIC_PAGE_META } from './content/pageMeta'
export { getPublicPages, toSitemapEntries } from './seo/publicPages'
export { buildSitemapXml } from './seo/sitemap'
export { applyHeadMeta, injectApp } from './seo/prerenderTemplate'
