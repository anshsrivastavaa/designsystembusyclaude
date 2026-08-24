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
// FOR EVERY LIST ON THIS SCREEN, WHICH IS A CORRECTION. This said the item list "deliberately
// highlights nothing on arrival ... and must not use this", and on that basis four journeys
// were left with the raw wait the helper exists to replace — one of them five lines under three
// correct uses in the same file. The first half is true and the second does not follow.
// `ComboBox.tsx` sets the highlight to the first row the moment `asked` is set, and typing is
// what sets it: on ARRIVAL the item list highlights nothing, and after a single keystroke it
// behaves exactly like the party list. Every one of those four journeys types before it
// presses, so every one of them was racing the same answer.
//
// NAME THE LIST. Two lists can be on screen at once — the party list is still there for a beat
// after a party is picked — and an unnamed `getByRole('option')` is answered by whichever one
// the browser reaches first. A journey that meant the item list and got the party list is not a
// slower version of the same check; it is a different check that happens to pass.

/** Types `term` into the list that already holds the keyboard and takes the row reading `row`,
 * once that row is the one the list is offering. `list` names the listbox to ask — "Party",
 * "Item", "Bill sundry" — and defaults to whichever is open when only one can be. */
export async function takeFromTheList(page: Page, term: string, row: string, list?: string): Promise<void> {
  await page.keyboard.type(term)

  const within = list === undefined ? page : page.getByRole('listbox', { name: list })

  await expect(within.getByRole('option').filter({ hasText: row }).first()).toBeVisible()
  // The highlight, not the mere presence of the row. This is the whole point of the helper, and
  // it is asked of the accessible state the browser reports rather than of a class or an
  // attribute standing in for it.
  await expect(within.getByRole('option', { selected: true })).toContainText(row)

  await page.keyboard.press('Enter')
}
