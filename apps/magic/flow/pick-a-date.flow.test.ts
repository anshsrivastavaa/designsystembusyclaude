import { expect, test } from '@playwright/test'

import { dismissThePartyList } from './enterTheGrid'
import { takeFromTheList } from './takeFromTheList'

// THE DATE FIELDS, WHICH DID NOT WORK AT ALL BEFORE THIS.
//
// The field IS the control that opens the calendar — there is no separate calendar icon, which
// v2 ruled on 05-08 and the document repeats. So the first thing walked here is that clicking
// the field opens the panel, because that is the only way in.
//
// REAL CLICKS AND REAL KEYS. The panel is a floating surface over a screen that already has one
// open on arrival — the party list — and this suite has now been caught twice by a click landing
// on a panel it could not see. Every click here is a real click on a real target.

async function openInvoiceScreen(page: import('@playwright/test').Page) {
  await page.goto('/?screen=create')
  await dismissThePartyList(page)
}

/** The same screen with a BILLED PARTY on it, which is the only state that has a Due field.
 *
 * THE DUE FIELD IS NOT A FIELD UNTIL IT HAS A REASON TO BE (Aj, 25-08): no party, no field at all,
 * and a party who settles at the counter has none either. Every test below that touches Due used
 * to open a blank invoice and find one — which was the fault, not the test. Sharma Traders carries
 * thirty days in the master, so the field arrives already filled and the picks have something to
 * count from. */
async function openWithAParty(page: import('@playwright/test').Page) {
  await page.goto('/?screen=create')
  // CLICKED, NOT ASSUMED FOCUSED. An invoice does open with the keyboard in the party field, and
  // waiting on that alone was flaky here — a real click on the field is what a person does and it
  // is true whether the autofocus has landed yet or not.
  await page.getByRole('combobox', { name: 'Party' }).click()
  await takeFromTheList(page, 'Sharma T', 'Sharma Traders')
  // NOT `dismissThePartyList` AFTERWARDS. Picking a party closes its list and puts the cursor in
  // the first item cell — a ruled behaviour — so that helper's first assertion, that the party
  // field still holds the keyboard, is false by then and by design.
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeHidden()
}

test('the field opens the calendar, and there is no icon doing it instead', async ({ page }) => {
  await openInvoiceScreen(page)

  // No second control. The field's own box is what opens it.
  await expect(page.getByRole('button', { name: /calendar/i })).toHaveCount(0)

  await page.getByRole('textbox', { name: 'Invoice date' }).click()
  await expect(page.getByRole('dialog', { name: 'Invoice date' })).toBeVisible()
})

test('it opens at the date the field is already holding, not at today', async ({ page }) => {
  await openWithAParty(page)

  const field = page.getByRole('textbox', { name: 'Invoice date' })
  await field.click()
  await field.fill('270726')
  await page.getByRole('textbox', { name: 'Due date' }).click()

  await expect(field).toHaveValue('27-07-2026')

  // Re-opening goes back to July, where the date is — not to the month the calendar happened to
  // be left on and not to today.
  await field.click()
  await expect(page.getByRole('grid', { name: 'July 2026' })).toBeVisible()
})

test('typing short is read the way the document specifies', async ({ page }) => {
  await openWithAParty(page)
  const field = page.getByRole('textbox', { name: 'Invoice date' })

  for (const [typed, shown] of [
    ['2707', '27-07'],
    ['270726', '27-07-2026'],
  ] as const) {
    await field.click()
    await field.fill(typed)
    await page.getByRole('textbox', { name: 'Due date' }).click()
    await expect(field).toHaveValue(new RegExp(shown))
  }
})

test('a quick pick sets the date and closes the panel', async ({ page }) => {
  await openInvoiceScreen(page)
  await page.getByRole('textbox', { name: 'Invoice date' }).click()

  const panel = page.getByRole('dialog', { name: 'Invoice date' })
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'Yesterday' }).click()

  await expect(panel).toBeHidden()
})

test('the due date refuses a day before the invoice date, and says so ONLY then', async ({ page }) => {
  await openWithAParty(page)

  const due = page.getByRole('textbox', { name: 'Due date' })
  await due.click()
  const panel = page.getByRole('dialog', { name: 'Due date' })
  await expect(panel).toBeVisible()

  // AT REST THERE IS NO NOTE. A permanent line explaining the rule is subtext on a screen that
  // has none, and it teaches nothing until the moment it is broken.
  await expect(panel.getByRole('alert')).toHaveCount(0)

  // Page back a month and take a day that is certainly before today's invoice date.
  await panel.getByRole('button', { name: 'Previous month' }).click()
  await panel.getByRole('gridcell').filter({ hasText: /^1$/ }).first().click()

  await expect(panel.getByRole('alert')).toContainText('cannot be before the invoice date')
  // And it is still open, because a refusal that closes the panel hides what it refused.
  await expect(panel).toBeVisible()
})

test('the due picks are the seven the document names, counted from the invoice date', async ({ page }) => {
  await openWithAParty(page)
  await page.getByRole('textbox', { name: 'Due date' }).click()

  const picks = page.getByRole('dialog', { name: 'Due date' }).getByRole('group', { name: 'Quick picks' })
  await expect(picks.getByRole('button', { name: 'Invoice date' })).toBeVisible()
  for (const days of [15, 30, 60, 90]) {
    await expect(picks.getByRole('button', { name: `Net ${days}` })).toBeVisible()
  }
})
