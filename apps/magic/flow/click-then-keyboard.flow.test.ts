import { expect, test } from '@playwright/test'

import { cellUnder } from './cells'

import { enterTheGrid } from './enterTheGrid'

// A mixed-input journey. Every other journey here starts with focus already in the grid and
// never touches the mouse, which proves a keyboard-only product — and this is not one. Real
// people click into a cell and then carry on typing, and that path was never walked.

test('clicking into a cell and then carrying on by keyboard', async ({ page }) => {
  await page.goto('/?rows=10')

  // Click into the Qty cell of the third row, the way somebody exploring the screen would.
  await (await cellUnder(page, 3, 'Qty')).click()

  // The click has to leave the keyboard somewhere, or everything after it is dead.
  await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()

  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('7')
  await expect(page.getByRole('textbox', { name: 'quantity' })).toHaveValue('7')

  await page.keyboard.press('Enter')
  await expect(page.getByRole('textbox', { name: 'price' })).toBeFocused()
})

test('the arrow keys carry the cursor onto the columns that are never typed into', async ({ page }) => {
  await page.goto('/?rows=10')
  await enterTheGrid(page)

  // Unit and Amount are reachable cells even when they are not typed into, so the cursor has
  // to be able to stand on them. Asking whether something drew an outline is not the same
  // question — an outline follows the grid's own idea of where it is, and can be perfectly
  // correct while the keyboard is somewhere else entirely.
  // As far right as the grid goes, counted from the headings — a fixed number of presses is a
  // proxy for "the last column", and it stopped being one when the optional columns arrived.
  const shown = await page.getByRole('grid', { name: 'Invoice items' }).getByRole('columnheader').allTextContents()
  for (let step = 0; step < shown.length; step += 1) await page.keyboard.press('ArrowRight')

  const amount = await cellUnder(page, 1, shown[shown.length - 1]!)
  await expect(amount.locator(':focus')).toHaveCount(1)
})

test('the keyboard still works after the cursor has stood on a column nobody types into', async ({ page }) => {
  await page.goto('/?rows=10')
  await enterTheGrid(page)

  // Onto the last column and back one. The column to its left is Tax Amt in this mode, which
  // is worked out — so this asks the same question it always did: after standing on a column
  // nobody types into, does the keyboard still move?
  const shown = await page.getByRole('grid', { name: 'Invoice items' }).getByRole('columnheader').allTextContents()
  for (let step = 0; step < shown.length; step += 1) await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowLeft')

  const before = await cellUnder(page, 1, shown[shown.length - 2]!)
  await expect(before).toBeFocused()
})

test('typing over a cell that already holds a value replaces it and finds the list', async ({ page }) => {
  await page.goto('/?rows=10')

  // Row one already holds an item. This is the path a person takes when they change their
  // mind about a line, and it is the one that was silently doing nothing.
  await enterTheGrid(page)
  const item = page.getByRole('combobox', { name: 'Item' })
  await expect(item).not.toHaveValue('')

  await page.keyboard.type('Copper')
  await expect(item).toHaveValue('Copper')
  await expect(page.getByRole('listbox', { name: 'Item' })).toBeVisible()
})
