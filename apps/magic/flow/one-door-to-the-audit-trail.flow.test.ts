// THE AUDIT TRAIL HAS EXACTLY ONE DOOR, and it is the row kebab.
//
// This is a ruling rather than a discovery: it is already true, and it is written as a journey
// so it stays true. An audit trail is about ONE invoice — who changed what on it and when — so
// it belongs to a row and nowhere else. The places it would otherwise creep into are the ones
// that act on many invoices at once, or on the table rather than on a record, and in every one
// of those "the audit trail" would have to mean something it cannot.
//
// A rule in a document is a suggestion. This is the check that fails when somebody adds the
// second door six weeks from now with the best of intentions.

import { expect, test } from '@playwright/test'

const AUDIT = /Audit Trail/i

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
  await expect(page.getByRole('row')).not.toHaveCount(0)
})

test('the audit trail is in the row kebab', async ({ page }) => {
  const row = page.locator('tbody tr').first()
  await row.hover()
  await row.getByRole('button', { name: /More actions/ }).click()

  await expect(page.getByRole('menuitem', { name: AUDIT })).toBeVisible()
})

test('and in no other menu on the screen', async ({ page }) => {
  // Table view: about how the table is arranged, not about any one invoice.
  await page.getByRole('button', { name: 'Table view' }).click()
  await expect(page.getByRole('dialog', { name: 'Table view' })).toBeVisible()
  await expect(page.getByText(AUDIT)).toHaveCount(0)
  await page.keyboard.press('Escape')

  // Filters: about which invoices are shown.
  await page.getByRole('button', { name: 'Filters' }).click()
  await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
  await expect(page.getByText(AUDIT)).toHaveCount(0)
  await page.keyboard.press('Escape')

  // The bulk bar and both of its menus: about MANY invoices, where an audit trail has no
  // single subject and would have to mean something it cannot.
  await page.locator('tbody tr').first().focus()
  await page.keyboard.press(' ')
  await expect(page.getByText('1 selected')).toBeVisible()
  await expect(page.getByText(AUDIT)).toHaveCount(0)

  await page.getByRole('toolbar', { name: /selected invoices/ }).getByRole('button', { name: 'Update' }).click()
  await expect(page.getByRole('dialog', { name: /Update the selected/ })).toBeVisible()
  await expect(page.getByText(AUDIT)).toHaveCount(0)
  await page.keyboard.press('Escape')

  // Scoped to the bulk bar: the row kebab is also called "More actions", for a row.
  await page.getByRole('toolbar', { name: /selected invoices/ }).getByRole('button', { name: 'More actions' }).click()
  await expect(page.getByRole('dialog', { name: 'More actions' })).toBeVisible()
  await expect(page.getByText(AUDIT)).toHaveCount(0)
})
