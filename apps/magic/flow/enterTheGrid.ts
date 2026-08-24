import { expect, type Page } from '@playwright/test'

import { cellUnder } from './cells'

// An invoice begins at the party field, so a journey about the grid has to get into the grid
// first — the way a person does, by clicking a cell. Journeys that are about the keyboard
// alone do not use this.
export async function enterTheGrid(page: Page) {
  // The party list is open on arrival and sits over the top of the grid, so it is dismissed
  // first — which is what a person does before reaching past it.
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeHidden()

  await (await cellUnder(page, 1, 'Item Name')).click()
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()
}
