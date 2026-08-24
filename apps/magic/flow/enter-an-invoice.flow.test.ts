import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'

import { cellUnder } from './cells'

import { enterTheGrid } from './enterTheGrid'
import { takeFromTheList } from './takeFromTheList'

// The first no-go test, run as a journey: enter item lines using only the keyboard. Enter
// walks Item, Qty, Price, then the next row. No dead ends, no focus traps, no step that needs
// the mouse.

test('a whole invoice can be entered from the keyboard alone', async ({ page }) => {
  await page.goto('/?screen=create')

  const grid = page.getByRole('grid', { name: 'Invoice items' })
  await expect(grid).toBeVisible()

  // An invoice begins at the party field, and no mouse is used anywhere in this journey.
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await takeFromTheList(page, 'Sharma T', 'Sharma Traders')

  // No tabbing into the grid: picking a party is the end of that step and the beginning of
  // this one, so the cursor is already in the first item cell.
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()

  for (let line = 0; line < 3; line += 1) {
    // The cursor is already in the Item cell of the row being filled.
    await page.keyboard.type('Steel rod')
    // The list takes a moment to arrive, the way it will from a real backend — and it has to
    // be the list for what was typed, not the one still on screen from a keystroke ago.
    await expect(page.getByRole('option').filter({ hasText: 'Steel rod' }).first()).toBeVisible()
    await expect(page.getByRole('option')).toHaveCount(8)

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Picking an item lands on Qty with its default already in place.
    await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('4')

    await page.keyboard.press('Enter')
    await expect(page.getByRole('textbox', { name: 'price' })).toBeFocused()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('125')

    await page.keyboard.press('Enter')
  }

  // Three filled lines. The grid pads itself with empty rows, so counting rows on screen
  // would count the padding — every count in this product means filled lines.
  await expect(page.getByRole('grid', { name: 'Invoice items' }).getByText('3 lines')).toBeVisible()
  await expect(page.getByRole('gridcell').filter({ hasText: '500.00' }).first()).toBeVisible()
})

test('the arrow keys reach the columns the typing walk skips', async ({ page }) => {
  await page.goto('/?rows=10')
  await enterTheGrid(page)

  // As far right as the grid goes. Counted from the headings rather than written as a number:
  // a step count is a proxy for "the last column", and it stopped being one the day the grid
  // learned its optional columns.
  const shown = await page.getByRole('grid', { name: 'Invoice items' }).getByRole('columnheader').allTextContents()
  for (let step = 0; step < shown.length; step += 1) await page.keyboard.press('ArrowRight')

  // Enter never visits the last column, so the arrows must. Asserted as focus INSIDE the cell:
  // the amount became typeable on 21-08, so the cell now holds an input and it is the input
  // that takes the keyboard, not the cell.
  const amount = await cellUnder(page, 1, shown[shown.length - 1]!)
  await expect(amount.locator(':focus')).toHaveCount(1)
})

test('the tax columns change sides with the mode, and the amount heading changes with them', async ({ page }) => {
  // PRICES EXCLUDING TAX: the tax columns come BEFORE the amount they add up to, and the
  // amount is the TAXABLE value.
  await openInvoice(page, '/?screen=create&rows=4', 3)
  await page.keyboard.press('Escape')
  const grid = page.getByRole('grid', { name: 'Invoice items' })
  // Wait for the MODE to have arrived, not for the grid. Settings come from the adapter like
  // everything else, and the screen draws the commonest mode until they land — so reading the
  // headings on the first paint reads the default and passes over a mode that never applied.
  await expect(grid.getByRole('columnheader', { name: 'Taxable' })).toBeVisible()
  const excluding = await grid.getByRole('columnheader').allTextContents()
  // HSN and Disc are ON by default, so they are part of the default screen — the point of this
  // journey is where the TAX columns sit, not how many columns there are.
  expect(excluding).toEqual(['#', 'Item Name', 'HSN / SAC', 'Qty', 'Unit', 'Price', 'Disc%', 'Tax %', 'Tax Amt', 'Taxable'])

  // PRICES INCLUDING TAX: the same columns AFTER the amount, because the amount already
  // contains them — and the amount is the NETT.
  await openInvoice(page, '/?screen=create&rows=4&tax=inclusive', 3)
  await page.keyboard.press('Escape')
  await expect(grid.getByRole('columnheader', { name: 'Nett' })).toBeVisible()
  const including = await grid.getByRole('columnheader').allTextContents()
  expect(including).toEqual(['#', 'Item Name', 'HSN / SAC', 'Qty', 'Unit', 'Price', 'Disc%', 'Nett', 'Tax %', 'Tax Amt'])

  // BILL-WISE: no tax columns at all. Tax arrives as generated charges instead.
  await openInvoice(page, '/?screen=create&rows=4&tax=billwise', 3)
  await page.keyboard.press('Escape')
  await expect(grid.getByRole('columnheader', { name: 'Tax %' })).toHaveCount(0)
  const billWise = await grid.getByRole('columnheader').allTextContents()
  expect(billWise).toEqual(['#', 'Item Name', 'HSN / SAC', 'Qty', 'Unit', 'Price', 'Disc%', 'Amount'])
})

test('the arrow keys walk the tax columns wherever the mode puts them', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=4&tax=inclusive', 3)
  const items = page.getByRole('grid', { name: 'Invoice items' })
  await expect(items.getByRole('columnheader', { name: 'Nett' })).toBeVisible()
  // The party list is open over the grid on arrival, so it goes first — pressing Escape before
  // it has opened dismisses nothing and leaves it sitting over the cell being clicked.
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeVisible()
  await page.keyboard.press('Escape')
  await (await cellUnder(page, 1, 'Item Name')).click()

  // Right from Item to the last column, which in this mode is Tax Amt. Counted from the
  // headings rather than written as a number, so switching another column on does not make this
  // journey wrong — it made nine of them wrong on 21-08.
  const shown = await items.getByRole('columnheader').allTextContents()
  const steps = shown.length - shown.indexOf('Item') - 1
  for (let step = 0; step < steps; step += 1) await page.keyboard.press('ArrowRight')
  await expect(await cellUnder(page, 1, 'Tax Amt')).toBeFocused()
})

test('a line that is not ordinary taxable goods says which kind it is', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=4', 3)
  await page.keyboard.press('Escape')

  // "Nil", not "0%". Nil-rated, exempt and zero-rated are three different facts and a return
  // groups by them; three columns of 0% would say the same wrong thing about all three.
  const taxPercent = await cellUnder(page, 3, 'Tax %')
  await expect(taxPercent).toHaveText('Nil')
})
