// EVERY EXPORT OF THE LIBRARY IS EITHER USED BY THE PRODUCT, OR SAID TO BE WAITING.
//
// WHAT HAPPENED. `Disclosure` was written because four collapsible headers had been hand-written
// and a fifth was about to be. `TableHeading` grew an `as="div"` mode built specifically for the
// item grid's column headings. Both then sat at ZERO call sites for weeks while all six of those
// jobs went on being hand-rolled beside them — and every gate stayed green, because the dead
// group asks whether ANYTHING imports a thing, and a story and a test both count. A component
// with a story and no screen is exactly the shape this misses.
//
// `Tabs look="bare"`, `TextField locked`, `Field message` and `Label htmlFor` are the same story
// one layer down: built for a named job the named job never adopted.
//
// SO THIS ASKS A NARROWER QUESTION: who uses it in the PRODUCT. A story is not a user, a test is
// not a user, and another library file is not a user either — a primitive nothing on a screen
// reaches is still a primitive nobody is using.
//
// BUILDING AHEAD OF THE SCREEN IS ALLOWED, AND COSTS A SENTENCE. Name it in docs/components.md
// with the job it is waiting for and the date it was written, and this passes. The date is the
// point: it makes the age of the wait visible, so "it will be adopted next week" cannot quietly
// become two months.
//
// Aj ruled on 25-08 that every backend figure is invented in `data/mock/`, so nothing here is
// waiting on real data — a component built ahead of its screen is not blocked, it is unadopted,
// which is what this keeps saying out loud.
//
// WHAT THIS GATE CANNOT SEE, AND ITS GREEN MUST NOT BE READ AS SAYING OTHERWISE. It works at the
// granularity of an EXPORT. `TableHeading` passes because `TableHead` puts it on every listing
// row — it is genuinely in the product. What has no screen is its `as="div"` MODE, built for the
// item grid's column headings and never adopted. An export-level check cannot tell a component
// that is half-used from one that is fully used, and the variant gate next door only asks whether
// a value draws differently, never whether a screen asked for it. **A variant nobody uses is
// covered by nothing today.**

import { readFileSync } from 'node:fs'

import { sourceFiles } from './source-files.mjs'

const LIBRARY = 'packages/ui'
const WAITING = 'docs/components.md'

/** Files that are the product: the screens and what they are built from. A story, a test, and
 *  the library itself are all excluded — see the header for why each. */
const isProduct = (path) =>
  path.startsWith('apps/') && !path.includes('.stories.') && !path.includes('.test.') && !path.includes('/flow/')

function exportedValues(source) {
  const found = []
  for (const [, names] of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of names.split(',')) {
      if (/^\s*type\s/.test(part)) continue
      const name = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (name && name !== 'default') found.push(name)
    }
  }
  for (const [, name] of source.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) {
    found.push(name)
  }
  return [...new Set(found)]
}

/** Files with no screen job and never will have one — the harness the browser tier is built out
 *  of. Each names its reason, because an exemption that only names a file is a hole. */
const NOT_FOR_A_SCREEN = {
  'packages/ui/mounted.ts': 'the component tier mounts and unmounts through it; a screen never does',
  'packages/ui/settled.ts': 'the component tier waits on it; a screen has nothing to wait for',
  'packages/ui/variants.ts': 'the variant gate reads components with it — it is a gate, not a control',
}

/** What a file imports from the library, by name. Parsed rather than grepped: a bare word in
 *  prose is not a user, which is the proxy this codebase bans first. */
function importsFromLibrary(source, alsoRelative = false) {
  const found = []
  // A PRODUCT FILE ONLY COUNTS WHEN IT REACHES FOR THE LIBRARY BY NAME. Counting its relative
  // imports too meant a screen importing its own local `Select` marked the library's `Select` as
  // adopted — a false green in exactly the direction that matters. Inside the library, relative
  // is how one primitive reaches another, so there it counts.
  const from = alsoRelative ? "(?:@busy\\/ui\\/|\\.\\/)" : "@busy\\/ui\\/"
  for (const match of source.matchAll(new RegExp(`import\\s+(?:type\\s+)?\\{([^}]+)\\}\\s+from\\s+'${from}[^']+'`, 'g'))) {
    for (const part of (match[1] ?? '').split(',')) {
      if (/^\s*type\s/.test(part)) continue
      const name = part.trim().split(/\s+as\s+/)[0]?.trim()
      if (name) found.push(name)
    }
  }
  return found
}

// USED MEANS REACHED FROM A SCREEN, NOT IMPORTED BY ONE. A primitive composed into another
// primitive is genuinely in the product — `TableHead` is never imported by a feature and is on
// every listing row. Counting direct imports only flagged eleven internals and would have taught
// everybody to ignore this gate by its second run.
const libraryFiles = sourceFiles(['.ts', '.tsx'], { from: LIBRARY }).filter(
  (path) => !path.includes('.stories.') && !path.includes('.test.'),
)

const exportsByFile = new Map(
  libraryFiles.map((path) => [path, exportedValues(readFileSync(path, 'utf8'))]),
)
const importsByFile = new Map(
  libraryFiles.map((path) => [path, importsFromLibrary(readFileSync(path, 'utf8'), true)]),
)

const used = new Set()
for (const path of sourceFiles(['.ts', '.tsx']).filter(isProduct)) {
  for (const name of importsFromLibrary(readFileSync(path, 'utf8'))) used.add(name)
}

// Walk outwards until nothing new is reached: a library file that exports something used is
// itself in the product, so whatever IT imports is used too.
for (let pass = 0; pass < libraryFiles.length; pass += 1) {
  let grew = false
  for (const path of libraryFiles) {
    const reached = (exportsByFile.get(path) ?? []).some((name) => used.has(name))
    if (!reached) continue
    for (const name of importsByFile.get(path) ?? []) {
      if (!used.has(name)) {
        used.add(name)
        grew = true
      }
    }
  }
  if (!grew) break
}

const waiting = readFileSync(WAITING, 'utf8')

const unadopted = []
let examined = 0
for (const path of libraryFiles) {
  if (path in NOT_FOR_A_SCREEN) continue
  for (const name of exportsByFile.get(path) ?? []) {
    examined += 1
    if (used.has(name)) continue
    // Named, with a job and a date. A bare mention is not enough — the sentence is the cost.
    const said = new RegExp(`\\b${name}\\b[^\\n]*\\b\\d{2}-\\d{2}\\b`).test(waiting)
    if (!said) unadopted.push({ name, path })
  }
}

const RULE = `every ${LIBRARY} export has a product importer, or is named in ${WAITING} with a date`

console.log('exports: 1 check')

if (examined === 0) {
  console.error(`  RAN NOTHING  ${RULE} — the library exports nothing at all`)
  console.error('exports: FAILED')
  process.exit(1)
}

if (unadopted.length > 0) {
  console.error(`  FAIL  ${RULE}  (${examined} exports, ${used.size} used by the product)`)
  for (const { name, path } of unadopted) {
    console.error(`        ${name} — ${path}, and no screen imports it`)
  }
  console.error(`        Adopt it, delete it, or write a line in ${WAITING} saying what job it`)
  console.error('        is waiting for and the date it was written. The date is the point.')
  console.error('exports: FAILED')
  process.exit(1)
}

console.log(`  ok    ${RULE}  (${examined} exports, ${used.size} used by the product)`)
console.log('exports: 1 check passed')
