import { expect, test } from '@playwright/test'

import { enterTheGrid } from './enterTheGrid'

// An item and a party are created in deliberately different ways. Adding an item happens fifty
// times an invoice and must not stop for anything; adding a party happens once, and sometimes
// not at all, and it is a record with a GSTIN and a balance.

test('an item nobody has heard of is created by carrying on typing', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)
  await page.keyboard.type('Titanium bracket')

  // The strip says what will happen. No drawer, nothing to dismiss.
  await expect(page.getByRole('listbox', { name: 'Item' })).toContainText('is new')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // And Enter belongs to the grid, so the walk carries on to Qty.
  await page.keyboard.press('Enter')
  await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()
})

test('a party nobody has heard of opens the drawer when the field is left', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.type('Karthik Trading Co')

  // Nothing happens while they are still typing.
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.keyboard.press('Tab')

  const drawer = page.getByRole('dialog', { name: 'Create Party' })
  await expect(drawer).toBeVisible()
  // Already filled in, and the cursor is in the first box.
  await expect(drawer.getByRole('textbox', { name: 'Name' })).toHaveValue('Karthik Trading Co')
  await expect(drawer.getByRole('textbox', { name: 'Name' })).toBeFocused()
})

test('what was typed lands in the box it looks like', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.type('9812345678')
  await page.keyboard.press('Tab')

  const drawer = page.getByRole('dialog', { name: 'Create Party' })
  await expect(drawer.getByRole('textbox', { name: 'Mobile' })).toHaveValue('9812345678')
  await expect(drawer.getByRole('textbox', { name: 'Name' })).toHaveValue('')
})

test('F2 creates the party and the cursor goes on to the first item', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.type('Karthik Trading Co')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('dialog', { name: 'Create Party' })).toBeVisible()
  // Wait for the drawer to be HOLDING the typed name, not merely open. Pressing F2 the
  // instant it appears is a race with the field being filled, and the drawer now refuses a
  // nameless party rather than creating one — so this waits for the thing F2 depends on.
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Karthik Trading Co')

  await page.keyboard.press('F2')

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Party' })).toHaveValue('Karthik Trading Co')
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()
})
