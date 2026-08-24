// The stories group: what Storybook can actually show.
//
// THIS ASKS THE CATALOGUE, NOT THE SHELF. The check this replaces asked the filesystem whether
// `Button.stories.tsx` sat beside `Button.tsx`. It did, for all eighteen, and it was green every
// day — while Storybook itself showed ONE page. The glob pointing at the library was written as
// a package name, `@busy/ui/**`, and Storybook resolves a glob against the `.storybook` folder,
// so it went looking for a folder called `@busy` inside it, found none, and said nothing. A
// glob that matches nothing is not an error to Storybook; it is simply a smaller catalogue.
//
// Aj found it by running Storybook, which is the whole point: the library is the handover
// argument to the product team, and it had been showing them a welcome page.
//
// So this builds Storybook and reads the index it produces — the same file the sidebar is drawn
// from. It costs about half a minute on every run of `npm run check`, which was accepted
// knowingly on 21-08: a check that reads the folder beside the component can only ever tell you
// the file is there, and "the file is there" was true the entire time.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

import { sourceFiles } from './source-files.mjs'

console.log('stories: 1 check')

// The same list the old check used: everything in the library that is a component, which is
// every .tsx that is not itself a story or a test.
const components = sourceFiles(['.tsx'])
  .filter((path) => path.startsWith('packages/ui/'))
  .filter((path) => !path.includes('.stories.') && !path.includes('.test.'))

const RULE = 'every component in packages/ui has a story Storybook can show'

if (components.length === 0) {
  console.error(`  RAN NOTHING  ${RULE} — no component was found to look for`)
  console.error('stories: FAILED')
  process.exit(1)
}

const out = mkdtempSync(join(tmpdir(), 'busy-storybook-'))
try {
  execFileSync('npx', ['storybook', 'build', '--output-dir', out, '--quiet'], {
    stdio: 'pipe',
    maxBuffer: 64 * 1024 * 1024,
  })
} catch (error) {
  console.error('  RAN NOTHING  Storybook did not build, so it has no catalogue to read')
  console.error(String(error.stderr ?? error).slice(-3000))
  console.error('stories: FAILED')
  process.exit(1)
}

const index = join(out, 'index.json')
if (!existsSync(index)) {
  console.error(`  RAN NOTHING  ${RULE} — Storybook built no index.json`)
  console.error('stories: FAILED')
  process.exit(1)
}

const entries = Object.values(JSON.parse(readFileSync(index, 'utf8')).entries ?? {})
// Every page in the sidebar, whatever it was built from — that is the number a person sees.
const pages = new Set(entries.map((entry) => entry.title)).size
// And the ones that came out of the library, which is what the rule is about. A gallery with no
// component of its own — the token and type pages — is a page like any other and belongs in the
// total, but it answers for no component, so it is not counted here.
const shown = new Set(
  entries
    .filter((entry) => String(entry.importPath).includes('packages/ui/'))
    .map((entry) => basename(String(entry.importPath)).replace('.stories.tsx', '')),
)

const missing = components.filter((path) => !shown.has(basename(path, '.tsx')))

if (missing.length > 0) {
  console.error(`  FAIL  ${RULE}  (Storybook shows ${pages} of ${components.length})`)
  for (const path of missing) console.error(`        ${path} — Storybook cannot see ${basename(path, '.tsx')}.stories.tsx`)
  console.error('        If the file exists, the glob in .storybook/main.ts is not reaching it.')
  console.error('stories: FAILED')
  process.exit(1)
}

console.log(`  ok    ${RULE}  (Storybook shows ${pages} pages, covering ${components.length} components)`)
console.log('stories: 1 check passed')
