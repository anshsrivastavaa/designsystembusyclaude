// THE SAME RUN OF CLASSES IN TWO FILES IS A COMPONENT NOBODY WROTE.
//
// One component per kind of thing is the rule this codebase is built on, and the way it breaks
// is never a decision — nobody sets out to build a second menu item. Somebody needs a row that
// looks like the rows over there, copies the line that makes them look like that, and now there
// are two. Both are right on the day. Then one gets a focus ring and the other does not.
//
// The previous build ended with 158 duplicate definitions, and every one of them started as a
// copied line. The dependency rules catch a feature importing a feature; nothing caught this,
// because a copied string is not an import.
//
// SIXTY CHARACTERS, AND IN MORE THAN ONE FILE. Both halves matter. Short runs — `flex
// items-center gap-2` — are idiom, not design: three utilities everybody writes and nobody
// should have to import. Long ones are a decision about how a thing looks, and a decision
// belongs in one place. Twice in one file is a loop somebody has not written yet, which is
// tidying; twice in two files is the thing that drifts, because the two files change on
// different days for different reasons.
//
// It counts CHARACTERS rather than utilities because that is what makes a line unreadable in a
// diff, and because a count of utilities invites the argument about whether a variant counts.

import { readFileSync } from 'node:fs'

import { sourceFiles } from './source-files.mjs'

const LONG = 60

// Utilities that carry no dash, colon or bracket. Everything else in a class run is recognised
// by shape, so this list stays short — it exists to let `flex` and `truncate` through without
// letting an English sentence through with them.
const BARE = new Set([
  'flex', 'grid', 'block', 'inline', 'hidden', 'contents', 'table', 'group', 'peer',
  'relative', 'absolute', 'fixed', 'sticky', 'static', 'isolate', 'invisible', 'visible',
  'truncate', 'uppercase', 'lowercase', 'capitalize', 'italic', 'underline', 'container',
  'transition', 'transform', 'resize', 'rounded', 'border', 'shadow', 'outline', 'ring',
])

const isUtility = (word) => BARE.has(word) || /[-:[\]/]/.test(word)

// EACH LINE NAMES ITS OWNER AND THE MOMENT IT GOES. An exemption with no end is a deletion of
// the rule, so nothing goes here without the thing that removes it.
const ALLOWED = [
  {
    run: 'flex h-full items-center border-r border-stroke px-2 text-body text-ink-secondary',
    why: "the sundry grid's cell, in SundryGrid.tsx and SundryLine.tsx",
    until: 'A owns features/invoice until Create Invoice is finished, and is taking this into one cell component',
  },
  {
    run: 'rounded-control border border-stroke bg-surface-raised shadow-popover',
    why: 'ComboBoxList paints its own panel instead of sitting in a Popover',
    until: 'ComboBoxList moves onto Popover — the last item on the drift list, deliberately, because it is the one with behaviour in it',
  },
]

const files = sourceFiles(['.tsx', '.ts'])
const where = new Map()
let examined = 0

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const [, , body] of text.matchAll(/(['"`])((?:[^'"`\\\n]|\\.)*)\1/g)) {
    // A template literal's ${...} holes split it into runs; each side is still a run of classes.
    for (const piece of body.split(/\$\{[^}]*\}/)) {
      const words = piece.trim().split(/\s+/).filter(Boolean)
      if (words.length < 3) continue
      if (!words.every(isUtility)) continue
      const run = words.join(' ')
      examined += 1
      if (run.length <= LONG) continue
      if (ALLOWED.some((allowed) => allowed.run === run)) continue
      if (!where.has(run)) where.set(run, new Set())
      where.get(run).add(file)
    }
  }
}

const RULE = `no run of classes over ${LONG} characters appears in more than one file`
console.log('drift: 1 check')

if (examined === 0) {
  console.error(`  RAN NOTHING  ${files.length} files and not one run of classes in any of them`)
  console.error('drift: FAILED')
  process.exit(1)
}

const copied = [...where].filter(([, seen]) => seen.size > 1)

if (copied.length > 0) {
  console.error(`  FAIL  ${RULE}  (${examined} runs)`)
  for (const [run, seen] of copied.sort((a, b) => b[0].length - a[0].length)) {
    console.error(`        ${run}`)
    for (const file of [...seen].sort()) console.error(`          ${file}`)
    console.error('        Give it a component or a utility, and let both files use that.')
  }
  console.error('drift: FAILED')
  process.exit(1)
}

console.log(`  ok    ${RULE}  (${examined} runs, ${ALLOWED.length} named exceptions)`)
console.log('drift: 1 check passed')
