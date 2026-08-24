// The visual group: a picture of every screen state against a committed baseline.
//
// OFF BY DEFAULT, AND THAT IS DELIBERATE RATHER THAN UNFINISHED. Font rendering is not the
// same on a Mac and on the Linux box CI runs on — not close, different hinting and different
// sub-pixel behaviour — so a baseline taken on one is red on the other for reasons that have
// nothing to do with the design. A snapshot suite that goes red for the machine is a suite
// people re-run instead of read, and then it catches nothing.
//
// So the baselines are made in CI and compared in CI, and this group says so on a laptop
// rather than pretending. It is the same shape as the token-with-no-uses gate: written,
// proved red against a planted change, and switched on in its own commit.
//
// TO SWITCH IT ON there is ONE step, and it needs a person because the whole point of this
// group is that a picture is approved rather than accepted:
//   Run the "visual baselines" workflow on GitHub. It takes the pictures on the same Linux CI
//   compares on, and uploads them. LOOK at them. Commit them under visual-baseline/. The group
//   is then on, in CI, with nothing else to remember.
//
// TO RUN IT ANYWAY, on this machine, against pictures taken on this machine:
//   VISUAL=on npm run check:visual
//   VISUAL=on npm run visual:accept     — writes the baselines, after you have looked
//
// A BASELINE MOVES ONLY WITH A PERSON'S EYES ON IT. `visual:accept` is not a tidy-up step and
// it does not belong in a "make the check pass" habit. The new picture goes in the SAME commit
// as the change that caused it, and both pictures go to Aj in the message reporting it.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'

const BASELINES = 'visual-baseline'
// IT ARMS ITSELF. `VISUAL=on` runs it here against pictures taken here; CI runs it the moment
// there are baselines to compare against, and reports itself off until then. That removes the
// step everybody forgets — there is no line left to flip, so the group cannot sit switched off
// after the pictures land because nobody remembered the second commit.
//
// It can still never be red for a reason that is not the design: with no baselines it does not
// run at all, and it only ever runs against pictures a person has looked at and committed.
const baselines = existsSync(BASELINES) ? readdirSync(BASELINES).filter((name) => name.endsWith('.png')) : []

// PICTURES IN A FOLDER THIS DOES NOT READ ARE A FAILURE, NOT A QUIET DAY.
//
// The artefact was called `visual-baselines` and this reads `visual-baseline`, one letter
// apart — so a whole set of CI baselines was unzipped under the artefact's name, and the group
// reported itself politely off with the pictures sitting beside it. Off for the right reason
// and off for the wrong reason looked identical, which is the failure this whole file exists
// to avoid. The workflow now names the artefact for this folder; this is the net under that.
const NEAR = ['visual-baselines', 'visual_baseline', 'visual_baselines', 'baseline', 'baselines', 'screenshots']
const strays = NEAR.filter((name) => name !== BASELINES && existsSync(name))
  .map((name) => ({ name, pictures: readdirSync(name).filter((file) => file.endsWith('.png')).length }))
  .filter((found) => found.pictures > 0)

if (baselines.length === 0 && strays.length > 0) {
  console.error('  FAIL  how every screen looks  (there are pictures in a folder I do not read)')
  for (const stray of strays) console.error(`        ${stray.name}/ holds ${stray.pictures} picture(s); this check reads ${BASELINES}/`)
  console.error(`        Rename the folder to ${BASELINES}/ — that is where an unzip of the "visual-baseline" artefact lands.`)
  console.error('visual: FAILED')
  process.exit(1)
}
const ON = process.env.VISUAL === 'on' || (process.env.CI === 'true' && baselines.length > 0)

console.log('visual: 1 check')

if (!ON) {
  console.log(
    baselines.length === 0
      ? '  off   how every screen looks  (no baselines yet — run the "visual baselines" workflow, look at what it took, commit it)'
      : "  off   how every screen looks  (baselines are Linux's; this machine renders text differently)",
  )
  console.log('        VISUAL=on npm run check:visual   to run it here against pictures taken here')
  console.log('visual: 1 check, switched off')
  process.exit(0)
}

const pictures = baselines

if (pictures.length === 0) {
  console.error('  FAIL  how every screen looks  (0 baselines)')
  console.error(`        No pictures in ${BASELINES}/ yet, so there is nothing to compare against and`)
  console.error('        nothing has been approved. Run the group, LOOK at what it took, and commit it:')
  console.error('        VISUAL=on npm run visual:accept')
  console.error('visual: FAILED')
  process.exit(1)
}

try {
  execFileSync('npx', ['playwright', 'test', '--config', 'playwright.visual.config.ts', '--reporter=line'], {
    stdio: 'pipe',
  })
} catch (error) {
  console.error(String(error.stdout ?? '').slice(-4000))
  console.error(`  FAIL  how every screen looks  (${pictures.length} baselines)`)
  console.error('        A screen does not look the way it was last approved. If the change was')
  console.error('        wanted, look at both pictures, then: VISUAL=on npm run visual:accept')
  console.error('        and commit the new baseline WITH the change that caused it.')
  console.error('visual: FAILED')
  process.exit(1)
}

console.log(`  ok    how every screen looks  (${pictures.length} baselines)`)
console.log('visual: 1 check passed')
