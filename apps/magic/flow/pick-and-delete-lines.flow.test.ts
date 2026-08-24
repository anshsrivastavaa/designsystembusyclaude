import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'

import { cellUnder } from './cells'

// PICKING LINES AND TAKING THEM OUT — journey 3, and the last one in phase one that was waiting
// on anybody outside the build. Aj ruled it on 21-08: inside Create Invoice, selection is for
// DELETE and nothing else.
//
// Its own file rather than more of the screen-holds-together one, which had reached the line
// limit — and these are about a behaviour layer that comes out whole if keyboard-only selection
// is rejected, so they should come out with it.

test('several lines are picked and taken out together', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=5', 3)
  await page.keyboard.press('Escape')
  await (await cellUnder(page, 1, 'Item Name')).click()
  // WAIT FOR THE CELL TO HOLD THE KEYBOARD BEFORE PRESSING ANYTHING. A click moves the cursor
  // and the keyboard follows on the next commit, so a key sent in the same breath as the click
  // lands before the grid is listening — which is a race a person cannot lose and a test can.
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()

  const before = await page.getByRole('row').count()
  const secondLine = await (await cellUnder(page, 2, 'Item Name')).textContent()

  // JOURNEY 3. Shift and Space picks the line the cursor is on — Space alone types a space into
  // the cell you are standing in, which is why this grid cannot use the listing's plain Space.
  // Nothing appears on hover and nothing appears on click: selection is keyboard only, which
  // reverses v2 deliberately.
  const bar = page.getByRole('status', { name: 'Selected lines' })
  await page.keyboard.press('Shift+Space')
  await expect(bar).toContainText('1 line selected')

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Shift+Space')
  await expect(bar).toContainText('2 lines selected')

  await bar.getByRole('button', { name: /Delete/ }).click()

  // The bar goes with the selection, and the line that was first is not there any more. The row
  // COUNT comes back through padding — the grid fills its height — so the count is not the
  // thing to assert on.
  await expect(bar).toHaveCount(0)
  // The two picked lines were the first and the second, so what was the second is not on the
  // invoice at all any more. The row COUNT comes back through padding — the grid fills its
  // height — so the count is not the thing to assert on.
  await expect(await cellUnder(page, 2, 'Item Name')).not.toHaveText(secondLine ?? '')
  expect(await page.getByRole('row').count()).toBeLessThanOrEqual(before)
})

test('a blank row cannot be picked, because there is nothing on it to take out', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=2', 2)
  await page.keyboard.press('Escape')
  // The line after the last filled one: padding the grid added to fill its height, which is a
  // row you can type into and not a line of the invoice.
  await (await cellUnder(page, 3, 'Item Name')).click()
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()
  await page.keyboard.press('Shift+Space')

  await expect(page.getByRole('status', { name: 'Selected lines' })).toHaveCount(0)
})
