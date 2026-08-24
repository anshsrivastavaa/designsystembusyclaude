// Which port this CHECKOUT serves on. Derived, never configured.
//
// WHY THIS IS NOT JUST A NUMBER. Two checkouts of this repository are worked on at the same
// time — one session on the create screen, one on the listing — and both run the same suite.
// A fixed port means the second run finds the port taken and fails, so somebody waits. That
// happened all of one night on 20-08. Clearing a leftover process, which is what this file
// replaced, fixes a DEAD server and does nothing at all about a LIVE one.
//
// So the port comes from the path of the checkout it is running in. The same checkout gets
// the same port for ever, two checkouts cannot collide unless they are the same directory,
// and there is nothing to configure, remember, or forget to change when a third checkout
// appears. A person never types a port number again.
//
// The range is deliberately high and unromantic: 31000–34999 sits above everything a
// developer machine hands out on its own and clear of every default this project uses —
// 5173 for the dev server, 6006 for Storybook, 4173 as the old preview port.

import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const FIRST = 31_000
const HOW_MANY = 4_000

/** A port for this checkout, offset for suites that must not share one. The flow group and
 * the visual group both serve the app, and the day both run in one command they would be
 * starting two servers — so each asks for its own offset rather than trusting the other to
 * have finished. */
export function portFor(suite) {
  const OFFSETS = { flow: 0, visual: 1 }
  const offset = OFFSETS[suite]
  if (offset === undefined) throw new Error(`portFor: no offset is reserved for "${suite}"`)

  const digest = createHash('sha256').update(REPO_ROOT).digest()
  // Two bytes is plenty of spread for the number of checkouts that will ever exist, and
  // keeps the arithmetic obvious to anybody reading it.
  const spread = digest.readUInt16BE(0) % (HOW_MANY / 2)
  return FIRST + spread * 2 + offset
}
