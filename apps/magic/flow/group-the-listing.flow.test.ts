// Grouping on, and the keyboard still works.
//
// Nothing walked a grouped table before this file, and it was broken the whole time. The
// heading bands are rows in the same table body as the invoices, and the cursor was found by
// counting children of that body — so with grouping on, "row 3" reached the fourth child, which
// after one band is the third invoice, and after landing ON a band, which has no tab stop,
// focus went nowhere at all and the keyboard was stranded inside the table.
//
// The screen looked completely right the entire time. That is why this is a journey and not a
// unit test: only walking it finds it.

import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
  await expect(page.getByRole('row')).not.toHaveCount(0)

  await page.getByRole('button', { name: 'Table view' }).click()
  await page.getByRole('menu', { name: 'Group by' }).getByRole('menuitemradio', { name: 'Party', exact: true }).click()
  await page.keyboard.press('Escape')

  // Bands are heading cells spanning the table. Until one is on the screen, nothing below is
  // testing a grouped table at all.
  await expect(page.locator('th[scope="colgroup"]').first()).toBeVisible()
})

test('the arrow keys step from invoice to invoice, past the bands rather than onto them', async ({ page }) => {
  const invoices = page.locator('tbody tr[data-row-index]')
  await invoices.first().focus()

  // Far enough down to cross at least one band, whatever the mock world's party order is.
  for (let press = 0; press < 5; press += 1) await page.keyboard.press('ArrowDown')

  await expect(invoices.nth(5)).toBeFocused()
})

// The first version of this test asked whether the keyboard was ever left on a band. It passed
// with the fault planted, because a band has no tab stop and the browser will not focus one
// whatever we ask — it was asserting something the DOM already guarantees, which is a check
// that cannot fail. This asks the thing that actually broke instead: does the ring keep
// arriving where it was sent, going back up as well as down.
test('the ring goes back up through the bands as well as down', async ({ page }) => {
  const invoices = page.locator('tbody tr[data-row-index]')
  await invoices.first().focus()

  for (let press = 0; press < 8; press += 1) await page.keyboard.press('ArrowDown')
  await expect(invoices.nth(8)).toBeFocused()

  for (let press = 0; press < 3; press += 1) await page.keyboard.press('ArrowUp')
  await expect(invoices.nth(5)).toBeFocused()
})

test('a band names the party, and the invoices under it belong to that party', async ({ page }) => {
  const firstBand = page.locator('th[scope="colgroup"]').first()
  const party = (await firstBand.textContent())?.trim() ?? ''
  expect(party).not.toBe('')

  // The row directly after the band is one of that party's invoices.
  const firstUnder = page.locator('tbody tr[data-row-index]').first()
  await expect(firstUnder).toContainText(party)
})
