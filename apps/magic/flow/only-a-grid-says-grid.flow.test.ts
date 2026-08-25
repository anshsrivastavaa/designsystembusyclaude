import { expect, test } from '@playwright/test'

import { cellUnder } from './cells'
import { enterTheGrid } from './enterTheGrid'
import { dismissThePartyList } from './enterTheGrid'

// A CONTROL THAT REPORTS A STATE IT IS NOT IN IS WORSE THAN NO CONTROL, and `role="grid"` is a
// report. It tells a screen reader to send its user in with the arrow keys, so the surfaces that
// wear it have to answer them.
//
// The bill sundry wore it and answered nothing: no arrow handling, no cell cursor, no tabindex
// management. It is now a table, which is what it is — three charges with a picker and a figure
// each, walked with Tab, and generated tax rows under them that cannot be typed into at all.
//
// THE TEST IS THE COMPETITION, NOT THE MARKUP. Asserting `role="table"` on the sundry would pass
// the day somebody puts the arrows on it and forgets to say so, and would pass the day somebody
// puts `role="grid"` back with nothing behind it — because it never asks whether the keys work.
// So this counts what claims to be a grid, and then makes the claim pay: the arrows move the
// cursor in the one that says grid, and the sundry's field keeps the keyboard where it is.

test('only the surface the arrow keys work in claims to be a grid', async ({ page }) => {
  await page.goto('/?screen=create')
  await dismissThePartyList(page)

  // EVERY claim on the screen, not a check of one element. A second unanswered grid arriving
  // anywhere on this screen fails here.
  const claims = page.getByRole('grid')
  await expect(claims).toHaveCount(1)
  await expect(claims.first()).toHaveAccessibleName('Invoice items')
})

test('the arrows move a cell cursor in the item grid', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)

  // OFF THE ITEM CELL FIRST. It is a combobox, where Down belongs to its own list — asking the
  // question there asks about the picker rather than about the grid. Amount is a plain cell, so
  // an arrow there can only mean the cursor. Not Amount: that column is headed Taxable or Nett
  // depending on the tax mode, and not Price: an editable cell hands the keyboard to its input.
  const taxAmount = await cellUnder(page, 1, 'Tax Amt')
  await page.keyboard.press('Escape')
  await taxAmount.click()
  await expect(taxAmount).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await expect(await cellUnder(page, 2, 'Tax Amt')).toBeFocused()
})

test('the bill sundry keeps the keyboard where it is, because Tab is how it is walked', async ({ page }) => {
  await page.goto('/?screen=create')
  await dismissThePartyList(page)

  const charges = page.getByRole('table', { name: 'Bill sundry' })
  const first = charges.getByRole('combobox').first()
  await first.click()
  await expect(first).toBeFocused()

  // Down does not move a cell cursor here, because there is not one — and now nothing tells
  // anybody there is. The field keeps the keyboard.
  await page.keyboard.press('Escape')
  await page.keyboard.press('ArrowDown')
  await expect(first).toBeFocused()
})
