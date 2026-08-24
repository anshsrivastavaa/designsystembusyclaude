// What a TEST must do. Out of check-shape.mjs because that file crossed 250 lines again, and
// the cap was right about what had grown: how a test behaves is a different subject from what
// may import what and what a file may be called.
//
// It stays in the same GROUP because a group is a list that maintains itself — the moment
// "shape" is two commands, one of them gets left off a CI file, which has already happened
// three times in the previous build.

import { readFileSync } from 'node:fs'

import { sourceFiles } from './source-files.mjs'

// EVERY COMPONENT TEST TAKES ITS TREE DOWN AGAIN. Five of the six in this repository created a
// root and then only removed the host element, which unmounts nothing: React keeps the tree,
// no effect cleanup ever runs, and everything it subscribed to stays subscribed — including
// the module-level stores the next test is about to change. The item grid kept a ResizeObserver
// and a window resize listener alive that way; its own cleanup is written correctly and simply
// never ran.
//
// That is invisible in one file and shows up as a suite that fails differently when it is run
// whole, which is the hardest kind of failure to chase. `mounted` in packages/ui remembers each
// root so `unmountAll` can take them down. Calling createRoot directly is how the tidy-up gets
// skipped, so it is refused here rather than left for whoever writes the next test to remember.
//
// Not every component test puts a tree on the screen — some ask a question of the stylesheet or
// of a pure function in a real browser. Those have nothing to take down, so the rule looks only
// at the ones that mount.
function unmountRule() {
  const mounting = sourceFiles(['.tsx'])
    .filter((path) => path.endsWith('.component.test.tsx'))
    .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
    .filter(({ source }) => /\bcreateRoot\(|\bmounted\(/.test(source))

  const notTakenDown = mounting.filter(
    ({ source }) => source.includes('createRoot(') || !source.includes('unmountAll()'),
  )

  if (mounting.length === 0) {
    return { ok: false, lines: ['  RAN NOTHING  the unmount rule found no component test that mounts anything'] }
  }

  if (notTakenDown.length > 0) {
    return {
      ok: false,
      lines: [
        `  FAIL  every component test unmounts what it mounted  (${mounting.length} tests mount a tree)`,
        ...notTakenDown.map(
          ({ path }) => `        ${path} — mount with mounted() from @busy/ui/mounted, and call unmountAll() in afterEach`,
        ),
      ],
    }
  }

  return {
    ok: true,
    line: `  ok    every component test unmounts what it mounted  (${mounting.length} tests mount a tree)`,
  }
}

export function testRules() {
  return [unmountRule()]
}
