// The test group. Runs every tier and reports how many tests each one ran. A tier that runs
// zero fails: an empty tier reporting green is the shape of failure this whole build is
// arranged against.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const TIERS = [
  { name: 'logic', matches: (file) => file.includes('.logic.test.') },
  { name: 'component', matches: (file) => file.includes('.component.test.') },
]

const output = join(mkdtempSync(join(tmpdir(), 'busy-tests-')), 'results.json')

try {
  // Two reporters on purpose. The JSON one is what this script counts; the readable one is
  // what a person needs when it goes red — with only JSON, a failure printed nothing at all
  // and the group could not be diagnosed from its own output.
  execFileSync(
    'npx',
    ['vitest', 'run', '--reporter=default', '--reporter=json', `--outputFile.json=${output}`],
    { stdio: 'pipe' },
  )
} catch (error) {
  console.error(String(error.stdout ?? ''))
  console.error(String(error.stderr ?? ''))
  console.error('tests: FAILED')
  process.exit(1)
}

const report = JSON.parse(readFileSync(output, 'utf8'))
let failed = false

console.log(`tests: ${TIERS.length} tiers`)

for (const tier of TIERS) {
  const files = report.testResults.filter((result) => tier.matches(result.name))
  const ran = files.reduce((total, file) => total + file.assertionResults.length, 0)

  if (ran === 0) {
    console.error(`  RAN NOTHING  the ${tier.name} tier matched no test file`)
    failed = true
    continue
  }

  console.log(`  ok    ${tier.name} tier  (${ran} tests in ${files.length} files)`)
}

if (failed || report.numFailedTests > 0) {
  console.error('tests: FAILED')
  process.exit(1)
}

console.log(`tests: ${report.numTotalTests} tests passed across ${TIERS.length} tiers`)
