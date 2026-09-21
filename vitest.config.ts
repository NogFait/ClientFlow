import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Two projects: `client` (jsdom, src/**) and `server` (node, api/**).
// `api/**` ships in M2 (Vercel Functions) — the project is declared now so
// CI/test wiring doesn't need to change when those files land.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'client',
          environment: 'jsdom',
          setupFiles: ['src/test/setup.ts'],
          // Page tests mount lazy routes in two languages; under a fully
          // parallel run a cold chunk import can brush vitest's 5s default,
          // which showed up as one-off timeouts (assertions are instant).
          testTimeout: 15000,
          include: ['src/**/*.test.{ts,tsx}'],
          // Tests must never depend on the developer's .env: any module that
          // (transitively) imports supabaseClient.ts calls createClient(),
          // which throws without a URL. These dummies keep CI hermetic.
          env: {
            VITE_SUPABASE_URL: 'http://localhost:54321',
            VITE_SUPABASE_ANON_KEY: 'test-anon-key',
            // The whole suite runs on the users' clock (UTC-3), on CI too:
            // any `new Date("YYYY-MM-DD")` sneaking back into the UI shows
            // the previous day here and fails fast. TZ is process-wide, so
            // it is set once for every worker rather than per test file.
            TZ: 'America/Argentina/Buenos_Aires',
          },
        },
      },
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['api/**/*.test.ts'],
        },
      },
    ],
  },
})
