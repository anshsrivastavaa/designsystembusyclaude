import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Two tiers here. The third, whole journeys through Playwright, arrives with the first
// journey — a tier with nothing in it would report green having run nothing.
//
// Logic runs in Node with no DOM: money, dates, contrast arithmetic. Component runs in a
// REAL browser, because the failure this build is named after was seven fields that were
// never hidden while every test asked whether the hiding class was present. Real CSS, real
// layout, real focus stack, or the test is asking about a proxy.

// The same alias the app and the type checker use. Three resolvers, three declarations, none
// of them reading the others.
// `.pathname` rather than node:url's fileURLToPath, so this config needs no @types/node —
// adding a whole type package to turn one URL into a path is a dependency for a one-liner.
const ui = new URL('./packages/ui', import.meta.url).pathname

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{ find: /^@busy\/ui\/(.*)$/, replacement: `${ui}/$1` }],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'logic',
          environment: 'node',
          // This product is used in India, so its tests run on Indian time. Left to the
          // machine, a date test says one thing on a designer's laptop and another on a CI
          // runner set to UTC — and the bug that made this necessary (a "today" that was
          // yesterday until half past five every morning) is invisible on a UTC machine, which
          // is precisely where it would have been checked. dateRanges.logic.test.ts opens by
          // asserting the offset, so losing this line fails a test rather than quietly
          // weakening four of them.
          env: { TZ: 'Asia/Kolkata' },
          include: ['**/*.logic.test.ts'],
          exclude: ['**/node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          include: ['**/*.component.test.tsx'],
          exclude: ['**/node_modules/**'],
          browser: {
            enabled: true,
            // The Chrome already on the machine, rather than a second copy downloaded into
            // node_modules. Same engine, and CI installs its own.
            provider: playwright({ launchOptions: { channel: 'chrome' } }),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
