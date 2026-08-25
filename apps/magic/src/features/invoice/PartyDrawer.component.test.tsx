// EVERY SELECT ON THIS DRAWER WEARS THE SAME FOCUS RING, AND ONE OF THEM DID NOT.
//
// The Dr/Cr side beside the opening balance was hand-styled with a class run that agreed with the
// other three selects in the product on everything except `focus-ring`. Run against the old
// markup, this test said what that actually cost: `auto 1px rgb(0, 95, 204) 0px` against
// `solid 2px rgb(0, 122, 255) 2px`. Chrome's own default ring, thinner, a different blue, and
// flush to the edge instead of two pixels clear. NOT an invisible ring, which is what it was
// first written up as — a DIFFERENT one on a single control, which is the consistency failure
// Nielsen Norman names: a ring that changes shape between two controls on one screen reads as
// the focus having moved somewhere else entirely.
//
// It is asserted as the BROWSER PAINTED IT under a real `:focus-visible`, not as the presence of
// a class and not as a prop that was passed. `Select` declares `focus-ring`; whether that class
// reaches an outline on the screen is a different question from whether it was written down, and
// this build has already believed a comment over a rendering once.
//
// THE COMPARISON IS BETWEEN THE TWO, not against a number. The point of adopting `Select` is not
// that the ring is 2px — it is that there is now ONE place saying what a select looks like, so
// the assertion is that the two selects on this drawer cannot disagree. A ring changed in
// packages/ui moves both or this fails.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import { settled } from '@busy/ui/settled'
import '../../index.css'
import { PartyDrawer } from './PartyDrawer'

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  unmountAll()
  host.remove()
})

/** The ring as painted, while the element is genuinely `:focus-visible`.
 *
 * TWO WAYS THIS PROBE CAN LIE, and both were hit writing it. `.focus()` alone on a `<select>`
 * paints nothing: Chrome matches `:focus-visible` on a programmatic focus only when the element
 * takes keyboard input, which a select does not, so the class is present, the outline computes to
 * `none`, and the test passes on exactly the fault it exists to catch. And a synthetic Tab
 * keydown dispatched to fake the keyboard is worse — `Drawer` traps Tab, so it caught the event
 * and pulled focus straight back onto its own panel.
 *
 * What works is the spec's own chain: focus a TEXT FIELD, which does match on a programmatic
 * focus, then move from there — an element focused programmatically from something already
 * focus-visible inherits it. Which is what happens to a person tabbing off the name field.
 *
 * The state is then ASSERTED rather than assumed, so a browser that stops honouring the chain
 * fails here loudly instead of quietly measuring the wrong state. */
async function ringOn(control: HTMLElement, from: HTMLElement): Promise<string> {
  from.focus()
  await settled(() => document.activeElement === from)
  control.focus()
  await settled(() => document.activeElement === control)
  expect(control.matches(':focus-visible')).toBe(true)
  const drawn = getComputedStyle(control)
  return `${drawn.outlineStyle} ${drawn.outlineWidth} ${drawn.outlineColor} ${drawn.outlineOffset}`
}

describe('the party drawer', () => {
  // Queried off the document, not off the host: `Drawer` portals its panel to `document.body`,
  // so a host-scoped query finds nothing and reads as the drawer rendering nothing at all.
  const selects = () => [...document.querySelectorAll<HTMLSelectElement>('[role="dialog"] select')]

  it('draws one focus ring across every select, including the Dr/Cr side that had none', async () => {
    mounted(host, <PartyDrawer typed="Sharma Traders" onClose={() => {}} onCreated={() => {}} />)
    await settled(() => selects().length >= 3)

    // Group, State and the Dr/Cr side. Named so a select disappearing fails here rather than
    // shrinking the sample to two that happen to agree.
    const side = selects().find((one) => one.getAttribute('aria-label') === 'Opening balance side')!
    const group = selects().find((one) => one.getAttribute('aria-label') === 'Group')!
    expect(side).toBeDefined()
    expect(group).toBeDefined()

    const name = document.querySelector<HTMLInputElement>('[role="dialog"] input[aria-label="Name"]')!
    const onSide = await ringOn(side, name)
    const onGroup = await ringOn(group, name)

    // ONE ASSERTION, AND ON PURPOSE. A second line asking "is there a ring at all" was written
    // first and deleted: the hand-styled select painted Chrome's default, so `outlineStyle` was
    // never `none` and that line could not fail. A check that cannot fail proves nothing and
    // reads as extra rigour, which is worse than not being there.
    //
    // What has to hold is that the two cannot disagree. A ring changed in packages/ui moves both
    // or this goes red.
    expect(onSide).toBe(onGroup)
  })
})
