// The dead group: exports nobody imports, and named fields nobody reads.
//
// The previous build had this check and this one did not. Its first run found four things that
// had been dead long enough for somebody to have read them and believed them.
// Dead code is not merely untidy: an export that nothing calls still gets read by whoever is
// working out how a thing behaves, and it is a description of the product that stopped being
// true without anybody noticing.
//
// IT ASKS WHO IMPORTS, NOT WHO MENTIONS. A word-grep standing in for a feature is the proxy
// this codebase bans first, and it fails in both directions here: `taxPaise` appears in five
// files and is read by none of them, while a name that happens to match a comment would be
// called alive. So the import list is parsed, and a bare name in prose counts for nothing.

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

import { sourceFiles } from './source-files.mjs'

// A story, a test and a gate are all allowed to reach for something nothing else uses: a story
// exists to show a component that no screen has adopted yet, and a test exists to hold a
// function to its promise before its first caller arrives. What they may NOT do is be the only
// reason something is alive — so they are read as consumers here, and the exception that
// matters is written where it can be seen rather than assumed.
const CONSUMERS = ['.ts', '.tsx', '.mjs']

/** Every VALUE a file exports. Types are deliberately not counted: an exported `SomethingProps`
 * is the component's own signature written down, and a caller that spreads props rather than
 * naming the type is not evidence the type is dead. Values are different — an exported function
 * nobody calls is a description of the product that quietly stopped being true. */
function exportsOf(path, source) {
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
  return [...new Set(found)].map((name) => ({ name, path }))
}

/** Every name a file imports, from anywhere. Only the names — which module they came from does
 * not matter, because a name imported anywhere is a name somebody is using. */
function importsIn(source) {
  const found = new Set()
  for (const [, names] of source.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from/g)) {
    for (const part of names.split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0]?.trim().replace(/^type\s+/, '')
      if (name) found.add(name)
    }
  }
  // `import X from` and `import * as X from`.
  for (const [, name] of source.matchAll(/import\s+(?:\*\s+as\s+)?([A-Za-z_$][\w$]*)\s+from/g)) found.add(name)
  return found
}

const files = sourceFiles(CONSUMERS).filter((path) => !path.includes('reference-old-build'))
const read = new Map(files.map((path) => [path, readFileSync(path, 'utf8')]))

const wanted = new Set()
for (const source of read.values()) for (const name of importsIn(source)) wanted.add(name)

// The entry points nothing imports BY DESIGN: a script is run, a config is loaded by a tool, a
// story is collected by Storybook, an app's root is mounted by its own index. Named here rather
// than guessed from a folder, so adding one is a deliberate act.
// AND THE SCHEMAS, WHICH ARE A PUBLISHED ARTEFACT RATHER THAN INTERNAL CODE. architecture.md
// says it plainly: printed out, `data/schema/` IS the API specification the backend team builds
// against, and it calls that the most valuable thing we hand over. A schema nothing in this
// application happens to import is still part of that document. I swept these before reading
// that, and un-exporting them was wrong.
const ENTRY = (path) =>
  path.startsWith('apps/magic/src/data/schema/') ||
  path.startsWith('scripts/') ||
  path.includes('.stories.') ||
  path.includes('.test.') ||
  path.endsWith('.config.ts') ||
  path.endsWith('main.tsx') ||
  basename(path).startsWith('.')

// TWO THINGS IN ANOTHER SESSION'S FOLDER, NAMED RATHER THAN QUIETLY SKIPPED.
//
// features/invoice belongs to the session building Create Invoice and this one may not edit it,
// so a gate that cannot land until somebody else moves is a gate that does not land. Both are
// real findings and both are reported: `fieldFor` and `rowsThatFit` are exported and imported
// nowhere. They are exempt here so the rule can protect everything else today.
//
// AN EXEMPTION WITH NO END IS A DELETION OF THE RULE. Each line goes the moment its owner acts;
// if this list is still here when Create Invoice finishes, that is the signal to chase it.
const NOT_MINE_YET = [
  'apps/magic/src/features/invoice/PartyDrawer.tsx fieldFor',
  'apps/magic/src/features/invoice/rowsThatFit.ts rowsThatFit',
]

const dead = []
for (const [path, source] of read) {
  if (ENTRY(path)) continue
  for (const { name } of exportsOf(path, source)) {
    if (wanted.has(name)) continue
    if (NOT_MINE_YET.includes(`${path} ${name}`)) continue
    dead.push({ path, name })
  }
}

console.log('dead: 1 check')

if (files.length === 0) {
  console.error('  RAN NOTHING  the dead-export rule looked at no file')
  console.error('dead: FAILED')
  process.exit(1)
}

if (dead.length > 0) {
  console.error(`  FAIL  nothing exports what nobody imports  (${files.length} files)`)
  for (const { path, name } of dead) console.error(`        ${path} — ${name} is exported and imported nowhere`)
  console.error('dead: FAILED')
  process.exit(1)
}

console.log(`  ok    nothing exports what nobody imports  (${files.length} files)`)
console.log('dead: 1 check passed')
