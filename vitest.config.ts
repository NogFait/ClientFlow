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
          include: ['src/**/*.test.{ts,tsx}'],
          // Tests must never depend on the developer's .env: any module that
          // (transitively) imports supabaseClient.ts calls createClient(),
          // which throws without a URL. These dummies keep CI hermetic.
          env: {
            VITE_SUPABASE_URL: 'http://localhost:54321',
            VITE_SUPABASE_ANON_KEY: 'test-anon-key',
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
