// Walks the repository for files a rule may look at. One place decides what "source" means,
// so a rule can never quietly scope itself to src/ and skip a package that has no src/
// folder — packages/tokens is exactly that shape.

import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Reference material is not source. It is read, never built, and it arrives named however the
// build it came from named it — a specification, an export from an older prototype. Naming each
// one as it appears is a race this loses: the filename rule has already blocked a push over a
// file nobody here wrote, and a raw-colour rule has already failed over a reference HTML page.
//
// So the checks look only where we BUILD, and everything else is reference by default. A new
// folder of somebody's screenshots cannot break a gate, and a new folder of ours cannot slip
// past one — because ours go in these.
const BUILD_ROOTS = ['apps', 'packages', 'scripts', '.storybook']

const SKIP_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  '.git',
  'storybook-static',
  'reference-old-build',
  'fonts',
  '.vitest-attachments',
  '__screenshots__',
  '.stryker-tmp',
])

export function sourceFiles(extensions, { from = '.', without = [] } = {}) {
  const found = []

  const walk = (directory) => {
    for (const entry of readdirSync(directory)) {
      if (SKIP_DIRECTORIES.has(entry)) continue
      const path = join(directory, entry).replace(/^\.\//, '')
      if (without.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) continue
      if (statSync(path).isDirectory()) walk(path)
      else if (extensions.some((extension) => path.endsWith(extension))) found.push(path)
    }
  }

  if (from === '.') {
    // The build roots, plus the configuration files that sit beside them at the top level.
    for (const entry of readdirSync('.')) {
      const path = entry
      if (BUILD_ROOTS.includes(entry)) walk(path)
      else if (!statSync(path).isDirectory() && extensions.some((extension) => path.endsWith(extension))) {
        if (!without.some((prefix) => path === prefix)) found.push(path)
      }
    }
  } else {
    walk(from)
  }

  return found.sort()
}
