// Putting an invoice aside, on the whole screen.
//
// A JOURNEY AND NOT A COMPONENT TEST, because the fault lived between two components. The store
// was cleared and the party's NAME was still in the field — and a component test of the action bar
// cannot see the party field at all. The first version of this check was written there, where the
// field is not mounted, so it skipped its own assertions and passed. A check that cannot fail
// proves nothing.

import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'
import { takeFromTheList } from './takeFromTheList'

test('putting an invoice aside empties the screen it leaves behind', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await takeFromTheList(page, 'Shah', 'Shah Enterprises')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('combobox', { name: 'Party' })).toHaveValue('Shah Enterprises')

  await page.getByRole('button', { name: 'Hold' }).click()
  await expect(page.getByRole('status')).toContainText('Put aside for Shah Enterprises')

  // THE FIELD, NOT THE STORE. What was reported was a screen that announced the invoice had been
  // put aside and then went on showing the party's name beside an empty grid and a zero total.
  // The store was right the whole time; the search box holds its own text — it has to, because
  // somebody halfway through typing a name has no party yet — and nothing put it back when the
  // invoice was cleared underneath it.
  await expect(page.getByRole('combobox', { name: 'Party' })).toHaveValue('')
  await expect(page.getByRole('grid', { name: 'Invoice items' })).toContainText('No lines yet')
})
