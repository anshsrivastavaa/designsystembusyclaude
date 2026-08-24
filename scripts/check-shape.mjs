// The shape group: what files may be called, and what may import what.

import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'

import { existsSync, readFileSync } from 'node:fs'

import { nameRules } from './shape-names.mjs'
import { paymentRules } from './shape-payment.mjs'
import { testRules } from './shape-tests.mjs'
import { sourceFiles } from './source-files.mjs'

let failed = false

// THE COUNT IS DERIVED, NOT TYPED. It said `shape: 10 checks` as a string literal at the top and
// again at the bottom, so the number was right only for as long as somebody remembered to change
// both — and a group whose count is a guess cannot honestly claim that a group running zero
// fails. Every result line goes through `result()`, the count is how many of those there were,
// and the lines are held until the end only so the header can print the real number first.
const OUT = []
const RESULTS = []
const result = (text) => {
  RESULTS.push(text)
  OUT.push(text)
}
const detail = (text) => OUT.push(text)

// EVERY EXIT GOES THROUGH HERE, for the same reason the count is derived: buffering lines so
// the header can carry a true number means a bare process.exit() prints nothing at all, and a
// red run that says nothing is worse than no run.
const flush = () => {
  console.log(`shape: ${RESULTS.length} checks`)
  for (const text of OUT) (text.startsWith('  ok') ? console.log : console.error)(text)
}
const stop = () => {
  flush()
  console.error('shape: FAILED')
  process.exit(1)
}

let cruise = { summary: { totalCruised: 0, error: 0, violations: [] } }
try {
  cruise = JSON.parse(
    execFileSync('npx', ['depcruise', 'apps', 'packages', '--config', '.dependency-cruiser.cjs', '--output-type', 'json'], {
      stdio: 'pipe',
      maxBuffer: 64 * 1024 * 1024,
    }).toString(),
  )
} catch (error) {
  const output = String(error.stdout ?? '')
  if (output.trim().startsWith('{')) cruise = JSON.parse(output)
  else {
    result(`  RAN NOTHING  dependency rules could not run — ${String(error.stderr ?? error)}`)
    stop()
  }
}

const { totalCruised = 0, violations = [] } = cruise.summary

if (totalCruised === 0) {
  result('  RAN NOTHING  dependency rules cruised no module')
  failed = true
} else if (violations.length > 0) {
  result(`  FAIL  dependencies point one way: no feature into a feature, no library into the app, nothing impure into lib, no cycles  (${totalCruised} modules)`)
  for (const violation of violations) {
    detail(`        ${violation.from} → ${violation.to} — ${violation.rule.name}`)
  }
  failed = true
} else {
  result(`  ok    dependencies point one way: no feature into a feature, no library into the app, nothing impure into lib, no cycles  (${totalCruised} modules)`)
}

// The plain ComboBox may never be dropped straight onto a screen. Only a named picker may
// instance it. Under time pressure the wrapper is the step that gets skipped — the plain
// component is right there and it almost works — and what arrives is several slightly
// different party pickers, which is 158 duplicate definitions by another route.
const PICKERS = [
  'packages/ui/ComboBox.tsx',
  'packages/ui/ComboBox.stories.tsx',
  'apps/magic/src/features/invoice/ItemPicker.tsx',
  'apps/magic/src/features/invoice/PartyPicker.tsx',
  'apps/magic/src/features/invoice/SundryPicker.tsx',
]

const screens = sourceFiles(['.tsx'], { without: PICKERS })
const direct = screens.filter((path) => /from\s+['"][^'"]*ComboBox['"]/.test(readFileSync(path, 'utf8')))

if (screens.length === 0) {
  result('  RAN NOTHING  the ComboBox rule looked at no file')
  failed = true
} else if (direct.length > 0) {
  result(`  FAIL  only a named picker may instance the plain ComboBox  (${screens.length} files)`)
  for (const path of direct) {
    detail(`        ${path} — wrap it in a named picker, or add that picker to the list in this check`)
  }
  failed = true
} else {
  result(`  ok    only a named picker may instance the plain ComboBox  (${screens.length} files)`)
}

// Everything pretend about today's data lives in one folder, and exactly one file outside it
// knows that folder exists. The handover is then: delete the folder, point that one line at a
// real backend. Anything else importing from it turns that into a search.
const MOCK = 'apps/magic/src/data/mock'
const SEAM = 'apps/magic/src/data/source.ts'

const outside = sourceFiles(['.ts', '.tsx'], { without: [MOCK, SEAM] })
const reachIn = outside.filter((path) => /from\s+['"][^'"]*data\/mock\//.test(readFileSync(path, 'utf8')))

if (outside.length === 0) {
  result('  RAN NOTHING  the mock rule looked at no file')
  failed = true
} else if (reachIn.length > 0) {
  result(`  FAIL  only ${SEAM} may import from ${MOCK}  (${outside.length} files)`)
  for (const path of reachIn) detail(`        ${path} — ask the adapter for it instead`)
  failed = true
} else {
  result(`  ok    only ${SEAM} may import from ${MOCK}  (${outside.length} files)`)
}

// Every shortcut is decided in one table. A set bound where each key happens to be used
// cannot be changed, cannot be printed for anyone, and hides two things claiming one key —
// our two references already disagree about F4.
const SHORTCUTS = 'apps/magic/src/lib/shortcuts.ts'
const application = sourceFiles(['.ts', '.tsx'], { without: [SHORTCUTS] })
  .filter((path) => path.startsWith('apps/magic/src/'))
const bindsKeys = application.filter((path) => /\bevent\.key\b|\bkey === ['"]/.test(readFileSync(path, 'utf8')))

if (application.length === 0) {
  result('  RAN NOTHING  the shortcut rule looked at no file')
  failed = true
} else if (bindsKeys.length > 0) {
  result(`  FAIL  every shortcut is decided in ${SHORTCUTS}  (${application.length} files)`)
  for (const path of bindsKeys) detail(`        ${path} — add a line to the table and ask it what the key means`)
  failed = true
} else {
  result(`  ok    every shortcut is decided in ${SHORTCUTS}  (${application.length} files)`)
}

// Every icon comes from the one table in packages/ui/Icon.tsx. An SVG pasted into a screen is
// how the previous build ended up with four shopping baskets — each drawn by whoever needed
// one that afternoon, none of them the same weight. The icon set moved to Phosphor on 20-08
// and this is what stops a thirty-first icon arriving by hand beside it.
const ICON_FILE = 'packages/ui/Icon.tsx'
const drawers = sourceFiles(['.tsx'], { without: [ICON_FILE] })
const drawnByHand = drawers.filter((path) => /<svg[\s>]/.test(readFileSync(path, 'utf8')))

if (drawers.length === 0) {
  result('  RAN NOTHING  the icon rule looked at no file')
  failed = true
} else if (drawnByHand.length > 0) {
  result(`  FAIL  every icon comes from ${ICON_FILE}  (${drawers.length} files)`)
  for (const path of drawnByHand) detail(`        ${path} — add a name to the icon table and use <Icon name="…" />`)
  failed = true
} else {
  result(`  ok    every icon comes from ${ICON_FILE}  (${drawers.length} files)`)
}

// THE STORY RULE MOVED OUT OF THIS GROUP, to scripts/check-stories.mjs. It asked whether
// Button.stories.tsx sat beside Button.tsx, which it did for all eighteen — while Storybook
// itself showed one page, because the glob naming the library never matched. Counting files on
// a shelf cannot answer a question about the catalogue, so the new one builds Storybook and
// reads what it lists. It costs half a minute; this cost nothing and was wrong.

// A COMPONENT TWO FEATURES USE, OR THE SHELL USES, LIVES IN packages/ui. The same dependency
// walk as the no-feature-imports-a-feature rule, asking a different question: that one stops a
// feature reaching sideways, this one notices when something has outgrown the feature it was
// born in. Left alone, the second user copies it — which is the previous build's 158 duplicate
// definitions arriving by the slowest possible route.
const featureOf = (path) => path.match(/^apps\/magic\/src\/features\/([^/]+)\//)?.[1] ?? null

/** The one component the shell composes for each screen. The shell using it is the POINT of a
 * feature, not a sign the component has outgrown one. Named here rather than guessed, so a
 * second entry point has to be argued for. */
const ENTRY_POINTS = [
  'apps/magic/src/features/invoice/CreateInvoice.tsx',
  'apps/magic/src/features/listing/InvoiceListing.tsx',
]

/** Resolve an import specifier against the file that wrote it, so `./store` inside the listing
 * means the listing's store and not every file called store in the repository. Matching on the
 * NAME was the first version and reported four things, three of which were a file importing its
 * own neighbour. */
function resolves(from, specifier) {
  if (!specifier.startsWith('.')) return null
  const target = join(dirname(from), specifier)
  for (const suffix of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
    if (existsSync(target + suffix)) return target + suffix
  }
  return null
}

const everySource = sourceFiles(['.tsx', '.ts'])
const shared = []
for (const path of everySource.filter((each) => featureOf(each) !== null && !ENTRY_POINTS.includes(each))) {
  const mine = featureOf(path)
  const users = new Set()
  for (const other of everySource) {
    if (other === path) continue
    const text = readFileSync(other, 'utf8')
    const reaches = [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].some(([, spec]) => resolves(other, spec) === path)
    if (!reaches) continue
    const theirs = featureOf(other)
    if (theirs === null && other.startsWith('apps/magic/src/app/')) users.add('the shell')
    else if (theirs !== null && theirs !== mine) users.add(theirs)
  }
  if (users.size > 0) shared.push({ path, users: [...users].join(', ') })
}

if (everySource.length === 0) {
  result('  RAN NOTHING  the shared-component rule looked at no file')
  failed = true
} else if (shared.length > 0) {
  result(`  FAIL  a component more than one feature uses lives in packages/ui  (${everySource.length} files)`)
  for (const { path, users } of shared) detail(`        ${path} — also used by ${users}`)
  failed = true
} else {
  result(`  ok    a component more than one feature uses lives in packages/ui  (${everySource.length} files)`)
}

// The rules that live in their own files hand back a line each, and they count exactly like the
// ones written above. They used to print straight to the screen — which is why they appeared
// ABOVE the header naming how many checks there were, and why that header said six.
for (const rule of [...paymentRules(), ...testRules(), ...nameRules()]) {
  if (rule.ok) result(rule.line)
  else {
    const [first, ...rest] = rule.lines
    result(first ?? '  FAIL  a rule failed without saying which')
    for (const text of rest) detail(text)
    failed = true
  }
}


if (RESULTS.length === 0) {
  result('  RAN NOTHING  this group reported no result at all')
  stop()
}
if (failed) stop()
flush()
console.log(`shape: ${RESULTS.length} checks passed`)
