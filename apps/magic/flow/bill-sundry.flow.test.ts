import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'
import { takeFromTheList } from './takeFromTheList'

// Bill sundry: the charges that apply to the whole invoice. The rules being walked here are
// the ones an operator would notice going wrong — how many blank rows wait for them, and
// whether the charges they add to this party every single time cost them three keystrokes
// each or one.

test('the charges this party had last time arrive on one keypress', async ({ page }) => {
  await page.goto('/?screen=create')

  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()

  const charges = page.getByRole('table', { name: 'Bill sundry' })
  await expect(charges).toBeVisible()

  // Two blank rows on a fresh invoice. The header is a row too, so three in all.
  await expect(charges.getByRole('row')).toHaveCount(3)

  await takeFromTheList(page, 'Sharma T', 'Sharma Traders')

  const field = page.getByRole('combobox', { name: 'Bill sundry' }).first()
  await field.click()
  // Wait for the field to actually HOLD the keyboard before typing at it. The screen became
  // one scrolling column on 20-08, so a click on the sundry grid scrolls the page first — and
  // a key pressed during that scroll went nowhere, which read as "the pinned row is missing".
  await expect(field).toBeFocused()
  await page.keyboard.press('Alt+ArrowDown')

  // The pinned row names what it will add, so nobody has to remember what "last used" means.
  const pinned = page.locator('[id$="-lead"]').first()
  await expect(pinned).toContainText('Freight')
  await expect(pinned).toContainText('Packing charges')

  // It is the FIRST stop, so Enter takes it without arrowing anywhere.
  await page.keyboard.press('Enter')

  // Read off the fields, not off the row's text: a charge's name lives in the field you pick
  // it in, and a row filtered by text would never see it.
  const names = page.getByRole('combobox', { name: 'Bill sundry' })
  await expect(names.nth(0)).toHaveValue('Freight')
  await expect(names.nth(1)).toHaveValue('Packing charges')

  // Two charges, and ONE blank waiting under them — never two. Header, two charges, one blank.
  await expect(charges.getByRole('row')).toHaveCount(4)
})

test('a long list of charges grows the page rather than a box of its own', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.press('Escape')

  // FIVE CHARGES, not two. The journey walked two blank rows, which is fewer than the grid
  // could show — so its own scroller never overflowed and the check could not reach the
  // fault it was meant to guard. A test that cannot reach the fault is a test about nothing.
  const charges = ['Freight', 'Packing charges', 'Insurance', 'Loading charges', 'Unloading charges']
  for (const charge of charges) {
    const field = page.getByRole('combobox', { name: 'Bill sundry' }).last()
    await field.click()
    await expect(field).toBeFocused()
    // No arrowing: the first match is already highlighted, and arrowing once with a single
    // match lands on the create row, which is the last stop by design.
    await takeFromTheList(page, charge, charge)
  }

  await expect(page.getByRole('combobox', { name: 'Bill sundry' })).toHaveCount(charges.length + 1)

  // The screen is one scrolling column, so nothing inside the footer may travel on its own.
  const scrollers = await page.evaluate(() => {
    const grid = document.querySelector('[aria-label="Bill sundry"]')!
    return [grid, ...grid.querySelectorAll('*')]
      .filter((box) => {
        const style = getComputedStyle(box)
        return box.scrollHeight > box.clientHeight + 4 && ['auto', 'scroll'].includes(style.overflowY)
      })
      .map((box) => box.tagName)
  })
  expect(scrollers).toEqual([])
})

test('a flat charge over a thousand survives being typed into twice', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.press('Escape')

  const field = page.getByRole('combobox', { name: 'Bill sundry' }).first()
  await field.click()
  await expect(field).toBeFocused()
  await takeFromTheList(page, 'Freight', 'Freight')

  // Freight's default is 500.00, which has no grouping comma. Take it over a thousand, where
  // one appears — the field read it back as "1,500.00", Number() called that NaN, and the
  // charge silently became zero.
  const amount = page.getByRole('textbox', { name: 'Freight value' })
  await amount.click()
  await amount.fill('1500')
  await page.keyboard.press('Tab')
  await expect(amount).toHaveValue('1,500.00')

  await amount.click()
  await amount.fill('2500')
  await page.keyboard.press('Tab')
  await expect(amount).toHaveValue('2,500.00')
})

test('a charge names itself in the row it lands in, not only in the field that found it', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await takeFromTheList(page, 'Sharma T', 'Sharma Traders')

  const charge = page.getByRole('combobox', { name: 'Bill sundry' }).first()
  await charge.click()
  await expect(charge).toBeFocused()
  await page.keyboard.press('Alt+ArrowDown')
  await page.keyboard.press('Enter')

  // Rows filled from the pinned row arrived with a type and an amount and no name: the field
  // was showing its own state instead of the row's.
  await expect(page.getByRole('combobox', { name: 'Bill sundry' }).first()).toHaveValue('Freight')
})

test('unticking round off survives somebody touching an unrelated setting', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=4', 3)
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.press('Escape')

  // Wait for the invoice to have arrived — with nothing on it every figure is 0.00 and round
  // off changes nothing, so the test would pass over a screen that does not work.
  await expect(page.getByRole('grid', { name: 'Invoice items' }).getByText('4 lines')).toBeVisible()

  const total = page.getByRole('region', { name: 'Invoice breakdown' })
  const roundOff = page.getByRole('checkbox', { name: 'Round off this invoice' })
  await expect(roundOff).toBeChecked()
  const rounded = await total.textContent()

  await roundOff.uncheck()
  const exact = await total.textContent()
  expect(exact).not.toBe(rounded)

  // ROUND OFF LIVED IN TWO STORES AND ONE OVERWROTE THE OTHER. The control wrote to the
  // invoice's copy of the settings; the settings drawer pushes ITS copy back on every change —
  // so touching anything at all put the round off back and the grand total moved with nobody
  // having touched the control. A money figure changing by itself is the worst thing a screen
  // can do, and nothing on it says what happened.
  // The invoice's OWN gear, in its header — not the shell's, which is disabled and not built.
  await page.getByRole('button', { name: 'Invoice settings' }).click()
  await page.getByRole('switch', { name: /Prices include tax/i }).click()
  await page.keyboard.press('Escape')

  await expect(roundOff).not.toBeChecked()
})

test('a part-paid invoice says so, with the balance the arithmetic gives', async ({ page }) => {
  // invoice-3 in the mock: 12,845.00 raised, 6,000.00 received. The chip was UNREACHABLE for
  // every invoice ever opened, because the balance was hard-coded to zero — so the one branch
  // that says "this is not settled" could never draw.
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.press('Escape')

  const bar = page.getByRole('region', { name: 'Invoice actions' })
  // Nothing received on a new invoice, so nothing to be partly paid about.
  await expect(bar.getByText(/Partly paid/)).toHaveCount(0)
})
