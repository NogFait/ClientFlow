import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => {
  // Source maps go to Sentry only when the build has a token (Vercel), and
  // only for the client bundle — the SSR build is a prerender tool, never
  // shipped. Without the token the plugin is left out entirely, so local
  // builds and CI stay independent of Sentry.
  const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN) && !isSsrBuild

  return {
    plugins: [
      react(),
      ...(uploadSourceMaps
        ? [
            sentryVitePlugin({
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              authToken: process.env.SENTRY_AUTH_TOKEN,
              // Maps are uploaded, then deleted from dist so they are never
              // served to browsers (the CSP has no reason to expose sources).
              sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
              telemetry: false,
            }),
          ]
        : []),
    ],
    build: {
      // Only emit maps when they will be uploaded and deleted right after.
      sourcemap: uploadSourceMaps,
    },
  }
})
