import { defineConfig, devices } from '@playwright/test'

import { portFor } from './scripts/ports.mjs'

// Derived from the path of this checkout, so two checkouts running the suite at the same time
// never fight over it. See scripts/ports.mjs — nobody types a port number.
const PORT = portFor('flow')

// The flow tier: a handful of whole journeys, not details. They are slow and brittle in bulk,
// so they stay few and stay about journeys — a person entering an invoice, not a component
// holding a value.
export default defineConfig({
  testDir: 'apps/magic/flow',
  testMatch: '**/*.flow.test.ts',
  // One at a time. There are a couple of dozen journeys and they take seconds, so parallelism
  // buys nothing — and it cost a great deal: journeys sharing one machine and one server with
  // a deliberately slow mock produced failures that could not be reproduced by running the
  // same journey on its own, which is the worst kind of red.
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    channel: 'chrome',
  },
  webServer: {
    // FEWER PROCESSES BETWEEN PLAYWRIGHT AND THE SERVER. This was `npx vite preview`, which is
    // npm → sh → npx → node: four processes, and Playwright can only see the first. Somewhere
    // in that chain the server was dying mid-run about one run in four, silently, taking every
    // remaining journey with it as a connection refused — forty-two "failures" that were one
    // event. Calling vite's binary directly removes two of the four.
    command: `npm run build --workspace @busy/magic && node ../../node_modules/vite/bin/vite.js preview --port ${PORT} --strictPort`,
    cwd: 'apps/magic',
    url: `http://localhost:${PORT}`,
    // Never reuse whatever happens to be on the port. It has twice served an older build to a
    // journey run — once making the suite look green over code that was not there, once
    // making it look red over code that was. A journey has to be walked against the build
    // being checked, so this always builds and serves its own.
    reuseExistingServer: false,
    timeout: 180000,
  },
})
