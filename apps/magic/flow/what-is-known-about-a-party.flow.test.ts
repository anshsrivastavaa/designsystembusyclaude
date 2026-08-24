import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'

// WHAT THE SCREEN KNOWS ABOUT A PARTY, and whether a keyboard can reach it.
//
// Its own file because it is not about the picker. `the-party-picker` had grown to 249 lines
// against a cap of 250 — one line from refusing the next thing anybody added — and the cap was
// right that it had become two subjects: choosing a party, and reading what is known about the
// one you chose. This is the second.

test('the keyboard reaches what is known about the party, without a mouse', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await page.getByRole('combobox', { name: 'Party' }).click()
  await page.getByRole('option').filter({ hasText: 'Sharma Traders' }).first().click()

  // THE SCREEN FINISHES MOVING THE CURSOR FIRST. Picking a party puts it in the first item cell
  // a beat later, so taking the keyboard back before that let the screen take it away again and
  // the Tab below started from the grid. Waiting for where the screen puts it is the wait
  // openInvoice makes for rows, not a pause.
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()
  await page.getByRole('combobox', { name: 'Party' }).focus()

  // EVERYTHING KNOWN ABOUT A PARTY WAS REACHABLE BY MOUSE ONLY, which broke the product's own
  // argument: an invoice this build says can be entered without touching the mouse had one
  // panel you could only open by pointing at it. The order is the order of the row — the grade
  // badge sits at the end of the field, the details control under it.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /Trust grade/ })).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('Sharma Traders')

  // And it hands the keyboard back to what opened it.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /Trust grade/ })).toBeFocused()
})
