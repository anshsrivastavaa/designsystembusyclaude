import { expect, test } from '@playwright/test'

import { takeFromTheList } from './takeFromTheList'

// WHEN THE BACKEND SAYS NO. `?refuse` makes the mock come back refused, so the state is designed
// and looked at rather than discovered on the day a real backend first says it.
//
// THE REFUSAL NAMES THE FIELD IT IS ABOUT, and that is the half that had never run.
// `Refusal.field` has been in the schema since the first day and `docs/backend-assumptions.md`
// promises the dev team it exists "so the screen can put the cursor on the thing to correct" —
// and the mock never set it, so the only refusal anybody could look at was the one kind the
// field does not help with. A promise the sample data cannot demonstrate is a promise nobody
// has tested.

test('a refusal that names a field puts the message AND the cursor on it', async ({ page }) => {
  await page.goto('/?screen=create&refuse')

  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await takeFromTheList(page, 'Sharma T', 'Sharma Traders', 'Party')

  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()
  await takeFromTheList(page, 'Steel rod', 'Steel rod', 'Item')

  await page.getByRole('button', { name: /^Save/ }).click()

  // The message is the backend's words, shown as they are.
  const alert = page.getByRole('alert').filter({ hasText: 'credit limit' })
  await expect(alert).toBeVisible()

  // AND THE CURSOR IS ON THE FIELD IT NAMED. Being told what is wrong and then having to find
  // it is most of the work of being told.
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
})
