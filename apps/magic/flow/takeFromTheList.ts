import { expect, type Page } from '@playwright/test'

// TAKING A ROW OUT OF A LIST THAT IS STILL BEING ANSWERED.
//
// THE LIST A JOURNEY CAN SEE IS NOT ALWAYS THE LIST ENTER WILL ACT ON. Every keystroke asks the
// mock again and every answer comes back a beat later, so a row can be on screen from the
// answer to "Sharma " while the answer to "Sharma T" is still in the air. When it lands it
// replaces the rows and clears the highlight — and Enter takes the HIGHLIGHTED row, so a press
// landing in that gap takes nothing at all. Nothing is picked, the cursor never moves on, and
// the journey then fails several steps later on a focus assertion that had nothing to do with
// the real fault: the item cell simply sat there inactive until the assertion gave up.
//
// THIS IS THE FLAKE THAT KEPT MOVING. The same missing wait was copied into eight journeys, each
// with its own small chance of losing the same race — so a different one went red each run and
// none of them went red twice running. That reads exactly like journeys leaking state into each
// other, and it is nothing of the kind. There is one mistake here, in eight places.
//
// So the wait is on the row Enter actually acts on. Not a sleep, and not "an option is on
// screen" — the one fact that decides what the press does. Same discipline as openInvoice
// waiting for rows rather than for the screen to have been drawn.
//
// ONLY FOR A LIST THAT HIGHLIGHTS ITS FIRST MATCH, which the party and bill sundry lists do. The
// item list deliberately highlights nothing on arrival — the section walk passes through it — so
// a journey there arrows onto the row it wants first, and must not use this.

/** Types `term` into the list that already holds the keyboard and takes the row reading `row`,
 * once that row is the one the list is offering. */
export async function takeFromTheList(page: Page, term: string, row: string): Promise<void> {
  await page.keyboard.type(term)

  await expect(page.getByRole('option').filter({ hasText: row }).first()).toBeVisible()
  // The highlight, not the mere presence of the row. This is the whole point of the helper, and
  // it is asked of the accessible state the browser reports rather than of a class or an
  // attribute standing in for it.
  await expect(page.getByRole('option', { selected: true })).toContainText(row)

  await page.keyboard.press('Enter')
}
