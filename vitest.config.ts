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
