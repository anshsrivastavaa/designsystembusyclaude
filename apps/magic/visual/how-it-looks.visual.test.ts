// A picture of every screen state, compared against a committed baseline.
//
// WHY THIS GROUP EXISTS. Types, lint, structure, tokens, behaviour and keyboard are all
// checked. How the product LOOKS is checked only by somebody noticing, which means a spacing
// change, a colour that stopped reading, or a control that quietly lost its border ships and
// is found weeks later by the person it annoys.
//
// A BASELINE MOVES ONLY WHEN A PERSON HAS SEEN THE BEFORE AND THE AFTER. Updating it is not a
// tidy-up step: the picture is the approval. `npm run visual:accept` writes the new ones, and
// they belong in the SAME commit as the change that caused them, with both pictures shown to
// Aj in the message that reports it. A baseline that moves without that is this group
// pretending to work.
//
// Every state here is one somebody could actually be looking at. A picture of a state nobody
// reaches is a picture that goes red for nothing.

import { expect, test } from '@playwright/test'

/** The app states. Two densities on the listing, because density is the whole reason the
 * token layer has a second dimension and it is the thing most likely to break silently. */
test.describe('the listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
    await expect(page.getByRole('row')).not.toHaveCount(0)
  })

  test('at standard density', async ({ page }) => {
    await expect(page).toHaveScreenshot('listing-standard.png', { fullPage: true })
  })

  test('at large density', async ({ page }) => {
    await page.getByRole('radio', { name: 'Large' }).click()
    await expect(page).toHaveScreenshot('listing-large.png', { fullPage: true })
  })

  test('with rows picked, so the bulk bar is up', async ({ page }) => {
    await page.locator('tbody tr').first().focus()
    await page.keyboard.press(' ')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press(' ')
    await expect(page.getByText('2 selected')).toBeVisible()
    await expect(page).toHaveScreenshot('listing-selection.png', { fullPage: true })
  })

  test('with the filters open', async ({ page }) => {
    await page.getByRole('button', { name: 'Filters' }).click()
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
    await expect(page).toHaveScreenshot('listing-filters.png')
  })

  test('with the period open', async ({ page }) => {
    await page.getByRole('button', { name: /Current FY/ }).click()
    await expect(page.getByRole('dialog', { name: 'Period' })).toBeVisible()
    await expect(page).toHaveScreenshot('listing-period.png')
  })

  test('with the table view open', async ({ page }) => {
    await page.getByRole('button', { name: 'Table view' }).click()
    await expect(page.getByRole('dialog', { name: 'Table view' })).toBeVisible()
    await expect(page).toHaveScreenshot('listing-tableview.png')
  })

  test('with nothing matching the filters', async ({ page }) => {
    await page.getByRole('button', { name: 'Search invoices' }).click()
    await page.getByRole('textbox', { name: /Search invoices/ }).fill('nothing matches this')
    await expect(page.getByRole('heading', { name: /Nothing matches/ })).toBeVisible()
    await expect(page).toHaveScreenshot('listing-empty.png', { fullPage: true })
  })
})

test('the create screen', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeHidden()
  await expect(page).toHaveScreenshot('create-invoice.png', { fullPage: true })
})
