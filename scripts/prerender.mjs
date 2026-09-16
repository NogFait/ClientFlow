// Build-time prerender of the public, indexable routes + sitemap.xml.
//
// Runs after `vite build` (client → dist/) and `vite build --ssr`
// (server → dist-ssr/). For each page in getPublicPages() — the 4 static
// routes, /blog, and one entry per PUBLISHED post — it renders the React
// tree to HTML, drops it into the client build's index.html and rewrites
// the per-route <head> tags, writing:
//
//   dist/index.html                  "/"
//   dist/pricing/index.html          "/pricing"     (Vercel serves /pricing from it)
//   dist/terms/index.html            "/terms"
//   dist/privacy/index.html          "/privacy"
//   dist/blog/index.html             "/blog"
//   dist/blog/<slug>/index.html      "/blog/<slug>"
//   dist/sitemap.xml                 generated from the SAME list, so the
//                                    sitemap can never advertise a URL that
//                                    wasn't prerendered (or miss one that was)
//   dist/app.html                    untouched shell — vercel.json rewrites every
//                                    non-prerendered route here so /login,
//                                    /dashboard, unknown slugs and 404s never
//                                    receive another page's markup.
//
// Plain ESM on purpose: Node runs it directly, no TS loader. Everything
// TypeScript (page list, template transforms, the React entry) arrives via
// the one SSR bundle.
import { mkdir, readFile, writeFile, rm } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

// react-dom picks its production build from NODE_ENV at import time. The SSR
// bundle externalises React, so without this a plain `node scripts/...` would
// prerender with the development build (slower, dev-only warnings).
process.env.NODE_ENV ??= "production"

const ROOT = process.cwd()
const DIST = path.join(ROOT, "dist")
const DIST_SSR = path.join(ROOT, "dist-ssr")
const SERVER_ENTRY = path.join(DIST_SSR, "entry-server.js")

const { render, getPublicPages, toSitemapEntries, buildSitemapXml, applyHeadMeta, injectApp } = await import(
  pathToFileURL(SERVER_ENTRY).href
)

const template = await readFile(path.join(DIST, "index.html"), "utf8")

// The SPA fallback shell must be copied BEFORE dist/index.html is
// overwritten with the landing's markup.
await writeFile(path.join(DIST, "app.html"), template)

const pages = getPublicPages()

for (const page of pages) {
  const appHtml = await render(page.path)
  if (!appHtml.includes("<h1")) {
    throw new Error(`prerender: ${page.path} rendered without an <h1> — did a Suspense boundary fail to settle?`)
  }

  const html = injectApp(applyHeadMeta(template, page), appHtml)
  const outDir = path.join(DIST, page.path)
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, "index.html"), html)
  console.log(`prerendered ${page.path} → ${path.relative(ROOT, path.join(outDir, "index.html"))}`)
}

// Static pages have no content date of their own, so their <lastmod> is the
// build date; posts carry their frontmatter date.
const today = new Date().toISOString().slice(0, 10)
await writeFile(path.join(DIST, "sitemap.xml"), buildSitemapXml(toSitemapEntries(pages, today)))
console.log(`sitemap.xml → ${pages.length} urls`)

// The SSR bundle is a build intermediate, not a deploy artifact.
await rm(DIST_SSR, { recursive: true, force: true })
