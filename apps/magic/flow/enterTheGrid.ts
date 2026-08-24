import { expect, type Page } from '@playwright/test'

import { cellUnder } from './cells'

// An invoice begins at the party field, so a journey about the grid has to get into the grid
// first — the way a person does, by clicking a cell. Journeys that are about the keyboard
// alone do not use this.

/** Gets the open party list out of the way, which is what a person does before reaching past it.
 *
 * IT IS NOT DECORATION AND IT IS NOT OPTIONAL. An invoice opens on the party field with its list
 * already up, and that list is a floating panel sitting OVER the grid — so a journey that clicks
 * a cell without dismissing it clicks the list. Two journeys did exactly that and passed anyway,
 * because they were clicking before the list had finished rendering and usually winning; the
 * moment they waited properly for the rows to arrive, the list was reliably there to catch the
 * click. Playwright named it outright: "…from div role=listbox aria-label=Party subtree
 * intercepts pointer events".
 *
 * That is the same fault this codebase already wrote up once, where a forced click landed on the
 * list's own "Create party" row and opened a drawer, green the whole time. */
export async function dismissThePartyList(page: Page) {
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeHidden()
}

export async function enterTheGrid(page: Page) {
  await dismissThePartyList(page)

  await (await cellUnder(page, 1, 'Item Name')).click()
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()
}
