// What the sticky action bar is allowed to cover, which is the middle of the page and not its end.
//
// ITS OWN FILE because `the-screen-holds-together` hit the 250-line cap, and the cap was right
// about which half had grown: that file is about the column scrolling as one, and this is about a
// pinned thing and what is underneath it.

import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'

// THE LAST THING IN THE CARD, NOT THE GRAND TOTAL LINE. This asked about the Grand Total, and
// the Grand Total stopped being the last thing in the card the moment Settle was added under it —
// so the guard went on passing while the control below it was permanently under the bar. That is
// what "settlement does not open" turned out to be: the press landed on the action bar.
//
// A SHORT WINDOW, because that is where it happens. At 900 high the card happened to clear the
// bar whatever the padding was, which is why nothing caught this at the size it was built at.
test('the action bar never covers the last thing in the breakdown', async ({ page }) => {
  // A REAL LAPTOP, not the tall window this screen was built at.
  await page.setViewportSize({ width: 1440, height: 800 })
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await page.keyboard.press('Escape')
  // FIRST: does the column scroll at all when there is nothing to scroll to?
  //
  // IT DID, BY EXACTLY THE BAR'S HEIGHT, ON EVERY WINDOW SIZE — and then by twice that, once a
  // bottom padding was added to "reserve room for the bar" which the bar already occupies. The
  // rows are what fill the space, so the fix is where they are counted: `rowsThatFit` takes the
  // pinned children's height off the room it offers. An earlier version of this check asserted
  // the padding instead, which was defending the fault.
  const travel = await page.evaluate(() => {
    const main = document.querySelector('main')!
    return main.scrollHeight - main.clientHeight
  })
  expect(travel).toBe(0)

  // SECOND: with the column scrolled to its foot, what does a finger land on?
  //
  // AT THE FOOT AND NOT AT REST, and the difference is worth being exact about. A pinned bar
  // covering the middle of a page is what a pinned bar IS — below about 660 pixels of window the
  // bar and the foot of the breakdown card overlap at rest whatever row the control sits on, and
  // no placement fixes that. What can be promised is that the column scrolls far enough to clear
  // it, and that is what the reserved room above guarantees.
  await page.evaluate(() => { const main = document.querySelector('main')!; main.scrollTop = main.scrollHeight })
  await page.waitForTimeout(50)

  // NOT toBeVisible — that passes over an element with something painted on top of it, which
  // is exactly the failure here. This asks the question a finger asks: if I put it on the last
  // control in the card, what do I touch?
  const covered = await page.evaluate(() => {
    const card = document.querySelector('[aria-label="Invoice breakdown"]')!
    const controls = [...card.querySelectorAll('button')]
    const last = controls[controls.length - 1]!
    const box = last.getBoundingClientRect()
    const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    if (at === null) return 'nothing is there — it is off screen'
    if (at.closest('[aria-label="Invoice actions"]') !== null) return 'the action bar is over it'
    return card.contains(at) ? 'the breakdown card' : `something else: ${at.tagName}`
  })
  expect(covered).toBe('the breakdown card')
})
