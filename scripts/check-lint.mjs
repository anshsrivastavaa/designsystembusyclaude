// The lint group. ESLint is perfectly happy to report success having linted nothing at all,
// which is how a check passes locally and never runs on the server. This reports the file
// count and fails on zero.

import { readFileSync } from 'node:fs'

import { ESLint } from 'eslint'

import { sourceFiles } from './source-files.mjs'

// THE CAP IS 250 AND THE WARNING STARTS AT 220.
//
// Four files have hit the cap now — the invoice store, the item grid, the party-picker journey
// and the date panel — and the rule was right every time. What was wrong every time was the
// moment: the file crosses 250 while somebody is finishing something else, so the split gets
// done under a red build, in a hurry, by whoever is holding it. That is the worst possible time
// to decide what two things a file actually is.
//
// So this says so thirty lines early, and it is an advisory rather than a failure. It cannot be
// an ESLint warning: this group fails on warnings as well as errors, deliberately, so a warning
// here would just be the cap moved to 220 wearing a softer word.
const CAP = 250
const WARN_FROM = 220

/** The number ESLint counts, which is not what `split` returns — a file ending in a newline has
 *  one fewer line than the split has pieces, and being one out either side of a cap is how a
 *  report starts arguing with the rule it is reporting on. */
const lineCount = (text) => text.split('\n').length - (text.endsWith('\n') ? 1 : 0)

const eslint = new ESLint()

// ESLint throws rather than returning an empty list when its own configuration excludes
// everything, and a raw stack trace is not a report. Both roads end at the same sentence.
//
// IT LINTS WHAT THIS REPOSITORY CALLS SOURCE, RATHER THAN EVERYTHING ON THE DISK. `lintFiles(['.'])`
// walks the whole tree, and ESLint's flat config does not read `.gitignore` — so an untracked,
// ignored folder is still linted. A self-hosted runner was unpacked into the checkout on 25-08 to
// get around Actions refusing to start jobs, and GitHub's own runner source arrived as 56 errors
// that blocked a push. Adding it to the ignore list would have been the third list of what to skip
// and the start of a race `source-files.mjs` already says it loses: "naming each one as it appears
// is a race this loses."
//
// So there is one answer to what source is and this asks it, which is the whole reason that file
// exists. A folder of somebody's tooling cannot break a gate; a new folder of OURS still cannot
// slip past one, because ours go in the build roots.
let results = []
try {
  // EVERY EXTENSION ESLINT WAS ALREADY READING, and the list was checked against the old scope
  // rather than guessed: narrowing it to .ts/.tsx/.mjs silently dropped `.dependency-cruiser.cjs`
  // and `scripts/ports.d.mts`, which is the coverage loss this repository has been bitten by three
  // times. The two scopes were compared file by file and differ now only by the runner.
  results = await eslint.lintFiles(sourceFiles(['.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts']))
} catch (error) {
  console.error('lint: RAN NOTHING — ESLint matched no file at all')
  console.error(`      ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

const errors = results.reduce((total, result) => total + result.errorCount, 0)
const warnings = results.reduce((total, result) => total + result.warningCount, 0)

console.log(`lint: ${results.length} files`)

if (results.length === 0) {
  console.error('lint: RAN NOTHING — no file matched, so nothing was checked')
  process.exit(1)
}

if (errors > 0 || warnings > 0) {
  const formatter = await eslint.loadFormatter('stylish')
  console.error(await formatter.format(results))
  console.error(`lint: FAILED — ${errors} errors, ${warnings} warnings`)
  process.exit(1)
}

console.log(`lint: ${results.length} files passed`)

const nearing = sourceFiles(['.ts', '.tsx', '.mjs'])
  .map((file) => [file, lineCount(readFileSync(file, 'utf8'))])
  .filter(([, lines]) => lines >= WARN_FROM && lines <= CAP)
  .sort((a, b) => b[1] - a[1])

if (nearing.length > 0) {
  console.log('')
  console.log(`      Coming up on the ${CAP}-line cap. Not a failure — a chance to split one on purpose:`)
  for (const [file, lines] of nearing) {
    console.log(`      ${String(lines).padStart(3)}  ${file}  (${CAP - lines} left)`)
  }
}
