// The flow tier: whole journeys through a real browser against a real production build.
// Separate group from the other two tiers because it builds and serves the app first, and
// because it must be visible in the run as its own line rather than hidden inside another.

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { portFor } from './ports.mjs'

const PORT = portFor('flow')

// A preview server left behind by a run that was INTERRUPTED holds the port, and Playwright
// then refuses to start rather than serving a stale build — which is right, and it is also a
// RED RUN CAUSED BY NOTHING IN THE CODE. That is the worst kind: it cost three re-runs on
// 20-08 and once failed the pre-push hook, which is exactly how people learn to pass
// --no-verify.
//
// This only ever kills a dead server belonging to THIS checkout: the port is derived from the
// checkout's own path, so there is no arrangement of running sessions in which it can reach
// another one's. Two live runs no longer meet at all — see scripts/ports.mjs.
function freeThePort() {
  try {
    const holding = execFileSync('lsof', ['-ti', `tcp:${PORT}`], { stdio: 'pipe' }).toString().trim()
    if (holding === '') return
    for (const pid of holding.split('\n')) process.kill(Number(pid), 'SIGKILL')
    console.log(`flow: cleared a leftover server on port ${PORT}`)
  } catch {
    // lsof exits non-zero when nothing holds the port, which is the ordinary case.
  }
}

freeThePort()

const output = join(mkdtempSync(join(tmpdir(), 'busy-flow-')), 'results.json')

// THE WHOLE RUN GOES TO A FILE BEFORE ANYTHING IS PRINTED.
//
// On 22-08 this group went red once and the output was lost, because the command was piped
// through grep to read the group summary lines — and grep threw away the one thing that would
// have said whether the server had died again or a journey had genuinely broken. Five green
// runs afterwards proved nothing about the red one.
//
// Discipline does not fix that; the next person reads the summary the same way. A file does.
// It is written whether the run passed or failed, because a flake is only interesting AFTER it
// has happened and by then the green run has already overwritten what you needed.
//
// reports/ is already gitignored, so this can never ride into a commit.
const LOG = join('reports', 'flow-run.log')

function keep(text) {
  mkdirSync('reports', { recursive: true })
  writeFileSync(LOG, text)
}

try {
  const said = execFileSync('npx', ['playwright', 'test', `--reporter=json`], {
    stdio: 'pipe',
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: output },
    maxBuffer: 64 * 1024 * 1024,
  }).toString()
  keep(said)
} catch (error) {
  const said = String(error.stdout ?? '') + String(error.stderr ?? '')
  keep(said)
  // A DEAD SERVER IS ONE EVENT, NOT FORTY-TWO FAILURES. When the thing serving the app goes
  // away mid-run, every journey after it fails with a connection refused — and a wall of red
  // that says forty-two journeys broke, when what broke was the server, is exactly how a red
  // run stops meaning anything. Say which it was.
  const refused = (said.match(/ERR_CONNECTION_REFUSED/g) ?? []).length
  console.error(said.slice(-4000))
  if (refused > 2) {
    console.error('')
    console.error(`flow: THE SERVER WENT AWAY — ${refused} journeys could not reach it.`)
    console.error('      That is one failure, not ' + refused + '. Nothing is known about the journeys')
    console.error('      after it died. Run the group again before reading anything into this.')
  }
  console.error('')
  console.error(`flow: the whole run is in ${LOG} — read that, not this summary`)
  console.error('flow: FAILED')
  process.exit(1)
}

const report = JSON.parse(readFileSync(output, 'utf8'))
const specs = report.suites.flatMap((suite) => suite.suites?.flatMap((inner) => inner.specs) ?? suite.specs ?? [])

console.log(`flow: ${specs.length} journeys`)

if (specs.length === 0) {
  console.error('flow: RAN NOTHING — no journey matched, so nothing was walked')
  process.exit(1)
}

const failed = specs.filter((spec) => !spec.ok)
for (const spec of specs) console.log(`  ${spec.ok ? 'ok   ' : 'FAIL '} ${spec.title}`)

if (failed.length > 0) {
  console.error('flow: FAILED')
  process.exit(1)
}

console.log(`flow: ${specs.length} journeys passed`)
