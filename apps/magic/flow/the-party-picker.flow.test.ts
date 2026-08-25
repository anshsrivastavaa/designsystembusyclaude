import { expect, test } from '@playwright/test'

import { itemGrid } from './cells'
import { openInvoice } from './invoice'

import { enterTheGrid } from './enterTheGrid'

// The six rulings on the party picker, one journey each where a journey can see it.

test('the list is already open when the party field takes focus', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('combobox', { name: 'Party' }).click()

  // No typing. Arriving is enough, because this field is a destination rather than somewhere
  // the cursor passes through.
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeVisible()
})

test('the party field can be left without picking anybody', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()

  // THE TRAP: three rulings met here. The list opens on focus, the first row is highlighted,
  // and Tab picks the highlighted row — so Tab always picked the first party and the field
  // could not be left. All three rulings are kept; what changed is that a list which opened
  // BY ITSELF highlights nothing.
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeVisible()
  await expect(page.getByRole('option', { selected: true })).toHaveCount(0)

  await page.keyboard.press('Tab')

  // Nothing was picked, and the keyboard left.
  await expect(page.getByRole('combobox', { name: 'Party' })).toHaveValue('')
  await expect(page.getByRole('combobox', { name: 'Party' })).not.toBeFocused()
})

test('arrowing into a list that opened by itself picks the first row, and typing does too', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()

  // Nothing highlighted is not the same as nothing to highlight: one arrow enters the list.
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('option', { selected: true })).toHaveCount(1)

})

test('the party list closes when you click away from it, and comes back when you return', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  const field = page.getByRole('combobox', { name: 'Party' })
  await expect(field).toBeFocused()
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeVisible()

  // TWO OF THIS CODEBASE'S OWN RULES COLLIDED HERE. Clicking anything that does not take focus
  // drops the keyboard on the page body, the containment net puts it straight back in this
  // field, and opening-on-focus reopened the list that had just been dismissed. From the
  // outside the list simply would not close.
  // A column heading: on the screen, named, and takes no focus — which is exactly the kind of
  // thing that used to leave the list open. A coordinate would depend on the window size.
  //
  // THE CHARGES HEADING, NOT THE ITEM ONE, AND NOT FORCED. The item heading sits directly under
  // the open party list, so a forced click was landing on the list's own "+ Create party" row
  // and opening the drawer — the journey was clicking blind and had been since the header
  // changed shape. Forcing a click past whatever is on top is how a test stops describing what
  // a person can do.
  //
  // THE ITEM TABLE'S LAST HEADING, far to the right. The party list drops from a field on the
  // left, and which headings it covers changes every time the header changes shape — this one
  // is the furthest from it there is.
  await itemGrid(page).getByRole('columnheader', { name: 'Taxable' }).click()
  await expect(page.getByRole('listbox', { name: 'Party' })).toHaveCount(0)

  // And a deliberate return is a fresh arrival, so it opens again.
  await field.click()
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeVisible()
})

test('the F10 hint shows while the party field is wanted and not before', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  // SCOPED TO THE PARTY FIELD. The item cell wears an F10 cap too now — it is the item drawer's
  // only keyboard door — so an unscoped locator matches both and Playwright refuses to guess.
  // Which is right: a journey that meant one control and measured the other is not a slower
  // version of the same check.
  const hint = page.getByRole('region', { name: 'Party' }).locator('kbd')

  // On arrival the field holds the keyboard, so the hint is there.
  await expect(hint).toHaveCSS('opacity', '1')

  // Once the keyboard has moved into the grid it goes. A shortcut hint that is on all the time
  // is a permanent label on the field every invoice already starts in.
  // TAB WALKS THE HEADER BEFORE IT REACHES THE GRID, which is v2's order and the reason the
  // number and the date sit where they do: party first because it is the first keystroke of
  // every invoice, then the fields that are checked rather than typed. So the grid is reached
  // by putting the keyboard in it, which is what a person does.
  await page.keyboard.press('Escape')
  await page.getByRole('row').nth(1).getByRole('gridcell').nth(1).click()
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()
  await expect(hint).toHaveCSS('opacity', '0')
})

test('typing is asking, so the first match is highlighted and Enter takes it', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()

  await page.keyboard.type('Sharma T')
  await expect(page.getByRole('option').filter({ hasText: 'Sharma Traders' }).first()).toBeVisible()
  // WHICH ROW, NOT HOW MANY. This asked that exactly one row was highlighted and never which —
  // and a list still showing the answer to "Sharma " has exactly one row highlighted too, so
  // the assertion was satisfied by the stale list this journey exists to rule out.
  await expect(page.getByRole('option', { selected: true })).toHaveCount(1)
  await expect(page.getByRole('option', { selected: true })).toContainText('Sharma Traders')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('combobox', { name: 'Party' })).toHaveValue('Sharma Traders')
})

test('the item cell does not open its list on arrival, because the walk passes through it', async ({ page }) => {
  await openInvoice(page, '/?rows=10', 10)
  await enterTheGrid(page)

  await expect(page.getByRole('listbox', { name: 'Item' })).toBeHidden()
})

test('a row carries the name on one line and the city and balance on the next', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('combobox', { name: 'Party' }).click()

  const row = page.getByRole('option').filter({ hasText: 'Sharma Traders' }).first()
  await expect(row).toContainText('Indore')
  await expect(row).toContainText('4,179.00 Cr')
})

test('a payable reads as a credit balance rather than a negative receivable', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('combobox', { name: 'Party' }).click()

  const row = page.getByRole('option').filter({ hasText: 'Sharma Traders' }).first()
  await expect(row).toContainText('4,179.00 Cr')
  await expect(row).not.toContainText('(')
  await expect(row).not.toContainText('-4,179')
})

test('recent parties come first, under their own heading', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('combobox', { name: 'Party' }).click()

  await expect(page.getByRole('listbox', { name: 'Party' })).toContainText('Recent')
  // Cash is in Recent because it is recent, not because it is pinned there.
  const first = page.getByRole('option').first()
  await expect(first).toContainText('Shah Enterprises')
})

test('the create row never scrolls away and the keyboard can reach it', async ({ page }) => {
  await page.goto('/?screen=create')
  const field = page.getByRole('combobox', { name: 'Party' })
  await field.click()

  const create = page.getByRole('option', { name: /Create party/ })
  await expect(create).toBeInViewport()

  // Even with a search that matches nothing at all, creating one is still there.
  await page.keyboard.type('Zzzz')
  await expect(create).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Create Party' })).toBeVisible()
})

test('the party drawer opens, closes on Escape, and gives the keyboard back', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('combobox', { name: 'Party' }).click()
  await page.getByRole('option').filter({ hasText: 'Sharma Traders' }).first().click()

  // THE GRADE BADGE IS THE DOOR, and it is the only one. A line under the field carrying the
  // city and the outstanding, with a Details control beside it, was ruled out on 23-08 — so
  // this walks the way that is left, and walking it is what proves the way in still exists.
  const badge = page.getByRole('button', { name: /trust grade/i })
  await badge.click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  // The panel looks the party up when it opens, so wait for the answer before pressing.
  await expect(drawer).toContainText('9000011117')
  await expect(drawer).toContainText('4,179.00 Cr')
  await expect(drawer.getByRole('region', { name: 'Trust grade' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()

  // The keyboard comes back to what opened it, rather than being dropped on the page.
  await expect(badge).toBeFocused()
})

test('an invoice begins at the party field, with its list already open', async ({ page }) => {
  await page.goto('/?screen=create')

  // Nothing clicked, nothing typed. You cannot save without a party, so this is where an
  // invoice starts — and the grid does not take the keyboard off it on the way in.
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeVisible()
})

test('pressing Save with no party puts the error and the cursor on the party field', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()

  // Save is never dead. It tells you what to correct, on the thing to correct.
  const save = page.getByRole('button', { name: /^Save/ })
  await expect(save).toBeEnabled()
  await save.click()

  await expect(page.getByRole('alert')).toContainText('Pick a party')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
})

test('the grid fills its height with empty rows and still counts only filled lines', async ({ page }) => {
  await page.goto('/?screen=create')

  // A spreadsheet is never a short list with a void under it. The rows are there to type in.
  //
  // Asserted as the void and not as a row count: a count is a proxy for "it fills the height"
  // that goes stale the moment anything else on the screen changes height, and it did — the
  // breakdown card grew on 20-08 and took a row with it. What has to stay true is that the
  // gap under the last row is too small to fit another row into.
  const gap = await page.evaluate(() => {
    const grid = document.querySelector('[role="grid"]')!
    const rows = [...document.querySelectorAll('[role="row"]')]
    const last = rows[rows.length - 1]!
    return {
      under: grid.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom,
      rowHeight: last.getBoundingClientRect().height,
    }
  })
  expect(gap.rowHeight).toBeGreaterThan(0)
  expect(gap.under).toBeLessThan(gap.rowHeight)

  // And none of them is a line yet. A count of rows would say eleven over an empty invoice.
  await expect(page.getByRole('grid', { name: 'Invoice items' }).getByText('No lines yet')).toBeVisible()
})
