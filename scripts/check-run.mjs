// `npm run check` — the one command, and the one list of what it is made of.
//
// IT USED TO BE A CHAIN OF `&&` IN package.json. That was fine while every group ran in every
// place. It stopped being fine the day CI had to run a smaller set than a laptop does, because
// the obvious way to do that is to write a second list of groups in the workflow file — and a
// hand-written list of checks in a workflow is precisely how three checks went missing in the
// previous build. One of them never ran on the server at all while passing locally.
//
// So there is still one list, it is here, and every group is on it. What varies is which ones a
// given run SKIPS, and a skipped group is announced at the end with where it runs instead. A
// group cannot be dropped quietly: not from CI, not from a hook, not by anybody in a hurry.
//
// A GROUP THAT EXISTS AND IS ON NO LIST FAILS THE RUN. That is the check on the check, and it is
// the thing the `&&` chain could not do.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

/** Every group this command runs, in order. */
const RUN = ['types', 'lint', 'shape', 'tokens', 'docs', 'dead', 'deps', 'tests', 'stories', 'flow', 'visual']

/** Groups that exist and are deliberately not part of this command, and where each one runs.
 *  Named rather than omitted — see the note about silence above. */
const ELSEWHERE = {
  session: 'the pre-push hook. It is about how this team works and means nothing to anybody else',
  mirror: 'the pre-push hook. It asks whether the handoff repository is still being fed',
}

/** What a run may be told to leave out, and where that group runs instead. A group may only be
 *  skipped if this says where it is still covered — "nowhere" is not an answer a run may give. */
const SKIPPABLE = {
  flow: 'the pre-push hook, on every push, before anything leaves the machine',
  stories: 'the pre-push hook, on every push, before anything leaves the machine',
  visual: 'nowhere yet — it has no baselines. Skipping it here changes nothing',
}

const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {}
const declared = Object.keys(scripts)
  .filter((name) => name.startsWith('check:'))
  .map((name) => name.slice('check:'.length))

// THE CHECK ON THE CHECK. A group with a script and no place on either list is a group that
// would run nowhere and be missed by nobody.
const unaccounted = declared.filter((name) => !RUN.includes(name) && !(name in ELSEWHERE))
if (unaccounted.length > 0) {
  console.error('check: FAILED before running anything')
  for (const name of unaccounted) {
    console.error(`  check:${name} exists and is on no list — add it to RUN, or to ELSEWHERE with where it runs`)
  }
  process.exit(1)
}

const missing = RUN.filter((name) => scripts[`check:${name}`] === undefined)
if (missing.length > 0) {
  console.error('check: FAILED before running anything')
  for (const name of missing) console.error(`  this command runs check:${name} and package.json has no such script`)
  process.exit(1)
}

const asked = (process.env.SKIP ?? '').split(',').map((name) => name.trim()).filter(Boolean)
const refused = asked.filter((name) => !(name in SKIPPABLE))
if (refused.length > 0) {
  console.error('check: FAILED before running anything')
  for (const name of refused) {
    console.error(`  SKIP names ${name}, and nothing says where ${name} runs instead`)
    console.error('  A group is skippable only where it is covered somewhere else. Say where, in SKIPPABLE.')
  }
  process.exit(1)
}

const skipped = RUN.filter((name) => asked.includes(name))
const running = RUN.filter((name) => !asked.includes(name))

for (const name of running) {
  try {
    execFileSync('npm', ['run', `check:${name}`], { stdio: 'inherit' })
  } catch {
    console.error('')
    console.error(`check: FAILED at ${name}`)
    say()
    process.exit(1)
  }
}

say()

/** The closing lines. Everything this run did not do, and where it is done instead. It prints on
 *  the way out of a red run as well as a green one, because a run that stops early has skipped
 *  more than it was asked to and that is worth seeing. */
function say() {
  // An ELSEWHERE group is named only where its file is actually here. This manifest travels to
  // the handoff repository with those script entries still in it and the files deliberately
  // carved out, and pointing the dev team at a command that cannot run is worse than saying
  // nothing. Nothing is lost: the pre-push hook runs each by path and says so if one has gone.
  const here = Object.entries(ELSEWHERE).filter(([name]) => {
    const file = scripts[`check:${name}`]?.match(/[\w./-]+\.mjs/)?.[0]
    return file !== undefined && existsSync(file)
  })
  const left = [...skipped.map((name) => [name, SKIPPABLE[name]]), ...here]
  if (left.length === 0) return
  console.log('')
  console.log('NOT RUN BY THIS COMMAND:')
  for (const [name, where] of left) console.log(`  ${name}  —  runs in ${where}`)
}
