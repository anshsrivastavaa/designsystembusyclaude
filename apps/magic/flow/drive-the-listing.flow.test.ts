// The listing, driven by the keyboard alone. Not "the keyboard also works" — this is the
// journey a person who never touches the mouse actually walks, in order, in one go.
//
// The claims that matter and that a mouse-first build always gets wrong: the toolbar is a
// handful of tab stops rather than one per control, the rows are ONE stop and the arrows move
// inside them, Space picks without opening, and Escape gets you out of whatever you are in
// without throwing away the whole screen when it was only a menu that was open.

import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
  // The rows arrive from the adapter, which is deliberately slow. Nothing below means
  // anything until they are on the screen.
  await expect(page.getByRole('row')).not.toHaveCount(0)
})

test('the whole table is one tab stop, not one per row', async ({ page }) => {
  const rows = page.locator('tbody tr')
  const count = await rows.count()
  expect(count).toBeGreaterThan(1)

  const reachable = await rows.evaluateAll((all) => all.filter((row) => (row as HTMLElement).tabIndex === 0).length)
  expect(reachable).toBe(1)
})

test('the arrow keys walk the rows and carry the keyboard with them', async ({ page }) => {
  const rows = page.locator('tbody tr')
  await rows.first().focus()

  await page.keyboard.press('ArrowDown')
  await expect(rows.nth(1)).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await expect(rows.nth(2)).toBeFocused()

  await page.keyboard.press('ArrowUp')
  await expect(rows.nth(1)).toBeFocused()
})

test('the arrows stop at the ends rather than wrapping round a list you are reading', async ({ page }) => {
  const rows = page.locator('tbody tr')
  await rows.first().focus()

  // A grid of cells wraps because the next cell is a real place to be. A list of records does
  // not: arrowing up from the first invoice and landing on the last is losing your place.
  await page.keyboard.press('ArrowUp')
  await expect(rows.first()).toBeFocused()
})

test('Space picks the row you are on without opening it', async ({ page }) => {
  const rows = page.locator('tbody tr')
  await rows.first().focus()

  await page.keyboard.press(' ')

  await expect(page.getByRole('toolbar', { name: /selected invoices/ })).toBeVisible()
  await expect(page.getByText('1 selected')).toBeVisible()
  // Still on the listing. Space picked; it did not navigate.
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
})

test('Home and End go to the ends of the page you are looking at', async ({ page }) => {
  const rows = page.locator('tbody tr')
  const last = (await rows.count()) - 1
  await rows.first().focus()

  await page.keyboard.press('End')
  await expect(rows.nth(last)).toBeFocused()

  await page.keyboard.press('Home')
  await expect(rows.first()).toBeFocused()
})

test('the slash key opens search and the keyboard lands in it', async ({ page }) => {
  await page.locator('tbody tr').first().focus()

  await page.keyboard.press('/')

  const field = page.getByRole('textbox', { name: /Search invoices/ })
  await expect(field).toBeVisible()
  await expect(field).toBeFocused()
})

test('typing in search does not fire the shortcuts hiding in what you typed', async ({ page }) => {
  await page.locator('tbody tr').first().focus()
  await page.keyboard.press('/')

  // "n" is New and "/" is Search. Neither may fire while somebody is typing a party name.
  await page.keyboard.type('no')

  await expect(page.getByRole('textbox', { name: /Search invoices/ })).toHaveValue('no')
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
})

test('Escape empties the search before it closes it, so one press never loses two things', async ({ page }) => {
  await page.locator('tbody tr').first().focus()
  await page.keyboard.press('/')
  await page.keyboard.type('metro')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('textbox', { name: /Search invoices/ })).toHaveValue('')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('textbox', { name: /Search invoices/ })).toBeHidden()
})

test('a menu opens on the keyboard, closes on Escape, and hands the keyboard back', async ({ page }) => {
  const button = page.getByRole('button', { name: /Current FY|Period/ }).first()
  await button.focus()
  await page.keyboard.press('Enter')

  const menu = page.getByRole('dialog', { name: 'Period' })
  await expect(menu).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(button).toBeFocused()
})

test('the status strip is one tab stop and the arrows move the choice inside it', async ({ page }) => {
  const strip = page.getByRole('radiogroup', { name: 'Invoice status' })
  await strip.getByRole('radio', { name: /^All/ }).focus()

  await page.keyboard.press('ArrowRight')

  await expect(strip.getByRole('radio', { name: /^Pending/ })).toHaveAttribute('aria-checked', 'true')
})

test('the toolbar is reached in reading order, a press per control', async ({ page }) => {
  // From the favourite star, which sits just after the listing's own name. Tabbing from here
  // has to walk the controls in the order the eye reads them — search first, because opening
  // it pushes the rest along rather than shoving them under New.
  await page.getByRole('button', { name: /favourites/ }).focus()

  const reached: string[] = []
  for (let press = 0; press < 5; press += 1) {
    await page.keyboard.press('Tab')
    reached.push(
      await page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim() ?? '',
      ),
    )
  }

  expect(reached[0]).toContain('Search')
  expect(reached[1]).toContain('Current FY')
  expect(reached[2]).toContain('Filters')
  expect(reached[3]).toContain('Table view')
  expect(reached[4]).toContain('New')
})

test('a settings switch changes the invoice while the drawer is still open', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=4', 3)
  await page.keyboard.press('Escape')

  const grid = page.getByRole('grid', { name: 'Invoice items' })
  await expect(grid.getByRole('columnheader', { name: 'Taxable' })).toBeVisible()

  // A SETTING TAKES EFFECT THE MOMENT IT CHANGES, which is why the drawer has no Save button.
  // Until 21-08 every switch in it wrote to a store nothing read: the surface was real and the
  // effect was not, which is worse than the surface not existing.
  // Named exactly, not .first(): the rail carries a disabled "Settings" area button, and the
  // loose match found that one the moment the gear moved off the top bar.
  await page.getByRole('button', { name: 'Invoice settings' }).click()
  await page.getByRole('combobox', { name: /Where is tax applied/i }).selectOption('sundry')

  // The drawer is still open, and the tax columns have already gone.
  await expect(grid.getByRole('columnheader', { name: 'Tax %' })).toHaveCount(0)
  await expect(grid.getByRole('columnheader', { name: 'Amount' })).toBeVisible()

  await page.getByRole('combobox', { name: /Where is tax applied/i }).selectOption('item')
  await page.getByRole('switch', { name: /Prices include tax/i }).click()
  await expect(grid.getByRole('columnheader', { name: 'Nett' })).toBeVisible()
})
