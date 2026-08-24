import { defineConfig } from '@playwright/test'

import { portFor } from './scripts/ports.mjs'

const PORT = portFor('visual')

// The visual group. Its own config rather than a project inside the flow one, because the two
// want opposite things: the flow group runs against the app in the machine's own Chrome, and
// this one must run in ONE pinned browser or it reports differences that are the machine's
// rather than the design's.
//
// PLAYWRIGHT'S OWN CHROMIUM, NEVER `channel: 'chrome'`. The flow config uses the Chrome that
// is already installed, which is right for behaviour and fatal here: it updates underneath
// you and every baseline moves on a day nobody touched the product.
//
// The baselines live in `visual-baseline/` and are committed. They are NOT under a folder
// called __screenshots__, which .gitignore excludes — that folder is where the component tier
// drops pictures of its own failures, and those should never be committed.
export default defineConfig({
  testDir: 'apps/magic/visual',
  testMatch: '**/*.visual.test.ts',
  snapshotPathTemplate: 'visual-baseline/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 900 },
    // Motion is the other thing that makes a snapshot suite cry wolf: a picture taken while a
    // popover is still fading in is a different picture every run.
    launchOptions: { args: ['--force-prefers-reduced-motion'] },
  },
  expect: {
    toHaveScreenshot: {
      // AN ABSOLUTE COUNT, NOT A RATIO, AND A SMALL ONE. This was maxDiffPixelRatio 0.002 to
      // begin with, which on a 1280x900 page is a licence for 2,300 changed pixels — recolouring
      // the summary total from full ink to muted ink passed straight through it. A check that
      // cannot fail proves nothing, so the tolerance is now a few dozen pixels: enough for
      // sub-pixel jitter between two runs on one machine, nowhere near enough to hide a colour,
      // a weight or a spacing change. Twelve, because two runs on this machine with nothing
      // changed differ by zero and the smallest real change measured was 64 — the tolerance
      // sits well below the thing it must catch rather than just under it.
      maxDiffPixels: 12,
      // How different one pixel has to be before it counts. Loose enough that anti-aliasing on
      // the same glyph is not a difference, tight enough that a changed ink is.
      threshold: 0.15,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  // ITS OWN PORT. The flow group serves the same app on its own derived port, and the day this group is
  // switched on the two would be starting a server on one port in the same run. Neither
  // reuses whatever is already there — deliberately, because a stale build once made the
  // suite green over code that was not there — so a shared port is a guaranteed collision.
  webServer: {
    command: `npm run build --workspace @busy/magic && npx vite preview --port ${PORT} --strictPort`,
    cwd: 'apps/magic',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180000,
  },
})
