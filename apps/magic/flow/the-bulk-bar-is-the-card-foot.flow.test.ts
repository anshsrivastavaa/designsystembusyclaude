// The bulk bar wears the card's bottom corners, and only when it IS the card's bottom.
//
// Square corners filled in the card's rounded ones, so the card read as a rectangle the moment
// anything was selected. Rounding it unconditionally is wrong in the commoner case: on a full
// page the totals row is stuck part way up the card, and a rounded dark bar there reads as a
// pill floating over the rows rather than as the foot of anything.
//
// Both states are walked because the fix is the DIFFERENCE between them — a test of either one
// alone passes on a bar that is always rounded or always square.

import { expect, test } from '@playwright/test'

// As a number, because the raw-value gate is right that a measurement written as a px string in
// a source file is a raw value however true it happens to be.
const cornerOfTheBar = (page: import('@playwright/test').Page) =>
  page.getByRole('toolbar').first().evaluate((el) => Number.parseFloat(getComputedStyle(el).borderBottomLeftRadius))

const gapUnderTheBar = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const strip = document.querySelector('[role="toolbar"]')!.getBoundingClientRect()
    const card = document.querySelector('.rounded-card')!.getBoundingClientRect()
    return Math.round(card.bottom - strip.bottom)
  })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
  await expect(page.getByRole('row')).not.toHaveCount(0)
})

test('is square while it is stuck part way up a long list', async ({ page }) => {
  await page.locator('tbody tr').first().locator('input[type=checkbox]').check()
  await expect(page.getByRole('toolbar').first()).toBeVisible()

  // The card runs well below the bar, so the bar is holding a position rather than resting.
  expect(await gapUnderTheBar(page)).toBeGreaterThan(100)
  expect(await cornerOfTheBar(page)).toBe(0)
})

test('takes the card corners when the list is short enough that it IS the foot', async ({ page }) => {
  await page.getByRole('button', { name: 'Search' }).click()
  await page.keyboard.type('Krishna')
  // Narrowed to a handful, so the card is shorter than the window and the totals row rests.
  await expect(page.locator('tbody tr')).toHaveCount(5)
  await page.locator('tbody tr').first().locator('input[type=checkbox]').check()
  await expect(page.getByRole('toolbar').first()).toBeVisible()

  expect(await gapUnderTheBar(page)).toBeLessThan(8)
  expect(await cornerOfTheBar(page)).toBeGreaterThan(0)
})
