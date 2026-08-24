// The lint group. ESLint is perfectly happy to report success having linted nothing at all,
// which is how a check passes locally and never runs on the server. This reports the file
// count and fails on zero.

import { ESLint } from 'eslint'

const eslint = new ESLint()

// ESLint throws rather than returning an empty list when its own configuration excludes
// everything, and a raw stack trace is not a report. Both roads end at the same sentence.
let results = []
try {
  results = await eslint.lintFiles(['.'])
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
