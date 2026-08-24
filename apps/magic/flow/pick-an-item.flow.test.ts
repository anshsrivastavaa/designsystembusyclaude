import { expect, type Page, test } from '@playwright/test'

import { cellUnder } from './cells'

import { enterTheGrid } from './enterTheGrid'
import { openInvoice } from './invoice'

// Being in the accessibility tree is not the same as being on the screen. The item list was
// present, correct and completely invisible for a day: it lived inside a cell 33 pixels tall
// with its overflow hidden, so all 256 pixels of it were clipped away. Playwright's
// toBeVisible() passed the whole time, because a clipped element still has a box.
//
// So these journeys ask the question a person asks: if I put my finger on the middle of that
// list, do I touch the list? Anything the browser is painting over it, or clipping it out of,
// answers no.
async function reallyOnScreen(page: Page, selector: string) {
  return page.evaluate((query) => {
    const element = document.querySelector(query)
    if (!element) return 'not in the page at all'
    const box = element.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return 'has no size'
    const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    if (at === null) return 'nothing is at its centre — it is off screen or clipped away'
    return element.contains(at) || element === at ? 'on screen' : `covered by ${at.tagName.toLowerCase()}`
  }, selector)
}

test('typing into a row that already holds an item shows the list on the screen', async ({ page }) => {
  await openInvoice(page, '/?rows=10', 10)

  // The case Aj hit twice, and the case no journey walked: a loaded invoice, a row that
  // already has an item, one keypress.
  //
  // The party list is open over the grid on arrival, and since 21-08 a pointer landing outside
  // an open list DISMISSES it rather than passing through to whatever is behind — which is what
  // every list does, and what a person experiences as one click to put it away and another to
  // act. So the list goes first, the way a person would put it away.
  await expect(page.getByRole('listbox', { name: 'Party' })).toBeVisible()
  await page.keyboard.press('Escape')

  // WAIT FOR THE INVOICE TO HAVE ARRIVED, and ask the grid rather than a row. The grid fills
  // itself with padding the moment it is drawn, so a row is clickable long before it holds
  // anything — and clicking a padding row that is replaced a moment later leaves the keyboard
  // on the page body, which is a passing test of the wrong screen at best.
  //
  // The count in the summary row is what says the invoice is here. Waiting for a row to have
  // SOME text was tried and is not the same thing: the summary row's own "No lines yet" is
  // text, and it sits at exactly the index a short grid puts under nth(5).
  const grid = page.getByRole('grid', { name: 'Invoice items' })
  await expect(grid.getByText('10 lines')).toBeVisible()

  const cell = await cellUnder(page, 5, 'Item Name')
  await cell.click()
  await page.keyboard.press('c')

  await expect(page.getByRole('listbox', { name: 'Item' })).toBeVisible()
  expect(await reallyOnScreen(page, '[role="listbox"]')).toBe('on screen')
})

test('the list on an empty invoice is on the screen too', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)
  await page.keyboard.type('Steel')

  await expect(page.getByRole('listbox', { name: 'Item' })).toBeVisible()
  expect(await reallyOnScreen(page, '[role="listbox"]')).toBe('on screen')
})

test('down moves to the next row from the item cell instead of dead-ending', async ({ page }) => {
  await openInvoice(page, '/?rows=10', 10)
  await enterTheGrid(page)
  await expect(page.getByRole('row').nth(2)).toBeVisible()

  // Every row starts in this column, so down has to go somewhere from it.
  await page.keyboard.press('ArrowDown')

  const secondRowItem = await cellUnder(page, 2, 'Item Name')
  await expect(secondRowItem.getByRole('combobox')).toBeFocused()
})

test('no item cell opens its list on arrival, empty or not', async ({ page }) => {
  await openInvoice(page, '/?rows=10', 10)
  await enterTheGrid(page)

  // Reverses an earlier ruling, deliberately. An auto-opening list has to capture Down to be
  // usable, and Down is also how you move down the grid — one cell cannot have both.
  await expect(page.getByRole('listbox', { name: 'Item' })).toBeHidden()

  await page.keyboard.press('Control+End')
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('combobox', { name: 'Item' })).toHaveValue('')
  await expect(page.getByRole('listbox', { name: 'Item' })).toBeHidden()

  // Typing opens it on the first keystroke, which is what happens anyway.
  await page.keyboard.type('S')
  await expect(page.getByRole('listbox', { name: 'Item' })).toBeVisible()
})

test('down moves down the grid from an item cell, and only the open list takes it', async ({ page }) => {
  await openInvoice(page, '/?rows=10', 10)
  await enterTheGrid(page)

  const secondRow = await cellUnder(page, 2, 'Item Name')
  await page.keyboard.press('ArrowDown')
  await expect(secondRow.getByRole('combobox')).toBeFocused()

  // With the list open it belongs to the list, and Escape hands it back.
  await page.keyboard.type('Steel')
  await expect(page.getByRole('listbox', { name: 'Item' })).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(secondRow.getByRole('combobox')).toBeFocused()

  await page.keyboard.press('Escape')
  await page.keyboard.press('ArrowDown')
  await expect((await cellUnder(page, 3, 'Item Name')).getByRole('combobox')).toBeFocused()
})
