// THE LAST THING `npm run check` SAYS: which groups exist here that it did not run.
//
// The command is meant to be the list — you read what is covered off a run rather than off a
// sentence in a document. A group the command does not run breaks that promise silently: it is
// present, it is green when anybody thinks to type it, and nothing anywhere says it was skipped.
// Three checks have already gone missing that way.
//
// So the chain ends here, and anything left out is left out OUT LOUD, with the command to run
// it, as the final line on the screen.
//
// IT IS GENERIC ON PURPOSE. It reads package.json and names whatever it finds, rather than
// holding a list of its own — a second list is a second thing that can disagree with the first,
// and this file travels to a tree whose groups are not ours.

import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
const scripts = manifest.scripts ?? {}

const fileIn = (command) => command?.match(/[\w./-]+\.mjs/)?.[0]
const present = (name) => {
  const file = fileIn(scripts[`check:${name}`])
  if (file === undefined) return scripts[`check:${name}`] !== undefined
  try {
    readFileSync(file)
    return true
  } catch {
    return false
  }
}

const groups = Object.keys(scripts)
  .filter((name) => name.startsWith('check:'))
  .map((name) => name.slice('check:'.length))

console.log(`groups: ${groups.length} scripts`)

if (groups.length === 0) {
  console.error('  RAN NOTHING  package.json declares no check: scripts to account for')
  console.error('groups: FAILED')
  process.exit(1)
}

const chain = new Set([...(scripts.check ?? '').matchAll(/check:([a-z]+)/g)].map(([, name]) => name))

// A GROUP IN THE CHAIN POINTS AT A FILE THAT IS ACTUALLY THERE. That is the one way this
// arrangement can still fail: a name in the chain whose file was deleted or renamed turns the
// whole command into a broken command rather than a shorter one.
const RULE = 'every group this command runs points at a file that exists'
const broken = [...chain].filter((name) => !present(name))

if (broken.length > 0) {
  console.error(`  FAIL  ${RULE}  (${chain.size} groups)`)
  for (const name of broken) console.error(`        check:${name} — ${scripts[`check:${name}`] ?? 'no such script'}`)
  console.error('groups: FAILED')
  process.exit(1)
}

console.log(`  ok    ${RULE}  (${chain.size} groups)`)
console.log(`groups: ${groups.length} scripts passed`)

// Named only if its file is here. A script entry whose file is absent is not a group somebody
// can run, so pointing at it would be an instruction that fails — and this manifest travels to a
// tree that deliberately has fewer files than script entries. Nothing is lost by the silence:
// each of these is also run by the pre-push hook and by CI as a path, which say so if it goes.
const left = groups.filter((name) => !chain.has(name) && present(name))
if (left.length > 0) {
  console.log('')
  console.log('NOT RUN BY THIS COMMAND. Run on every push by the hook, and separately on CI:')
  for (const name of left) console.log(`  ${name}   npm run check:${name}`)
}
