// The documents group. IT RUNS IN THE DEV TEAM'S TREE TOO, so everything in it must hold true
// of a repository that has none of our session files.
//
// EVERY PACKAGE THE ARCHITECTURE TABLE NAMES IS ACTUALLY INSTALLED.
//
// The document named four that were not: a server-state library, a virtualiser, a form library
// and the desktop wrapper. The dev team's brief is "implement one interface and the front end
// works", so a document promising a caching layer that does not exist is a promise they find by
// looking for it — which is the most expensive way to find anything.
//
// It reads the STACK TABLE only. Prose may discuss a package nobody has chosen; the table is
// the list of what this build is MADE OF, and that list has to be true.

import { readFileSync } from 'node:fs'

import { installedPackages, namesIn } from './stack-names.mjs'

const ARCHITECTURE = 'docs/architecture.md'

const have = installedPackages()
const table = readFileSync(ARCHITECTURE, 'utf8').split('\n').filter((line) => line.startsWith('|'))

// THE EXEMPTION IS PER NAME, NOT PER ROW. It used to ask whether the row contained the words
// "not installed" anywhere — so one disclaimer about one package excused every package named
// beside it, and a row reading "shadcn/ui on Radix, plus cmdk … cmdk is not installed" would
// have excused Radix and shadcn/ui as well. That is the same loose window the session group had
// already been tightened against, arrived at independently in a second file. One test now, in
// stack-names.mjs, used by both.
const promised = []
for (const { named, packageName, excused } of namesIn(table.join('\n'))) {
  if (excused || have.has(packageName)) continue
  if (promised.some((line) => line.startsWith(`${named} —`))) continue
  promised.push(`${named} — the table names it, ${packageName} is not installed`)
}

const RULE = `every package the ${ARCHITECTURE} stack table names is installed`

console.log('docs: 1 check')

if (table.length === 0) {
  console.error(`  RAN NOTHING  ${RULE} — the table has no rows`)
  console.error('docs: FAILED')
  process.exit(1)
}

if (promised.length > 0) {
  console.error(`  FAIL  ${RULE}  (${table.length} table rows)`)
  for (const failure of promised) console.error(`        ${failure}`)
  console.error('docs: FAILED')
  process.exit(1)
}

console.log(`  ok    ${RULE}  (${table.length} table rows)`)
console.log('docs: 1 check passed')
