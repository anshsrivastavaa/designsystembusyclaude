import { expect, test } from '@playwright/test'

import { cellUnder } from './cells'
import { enterTheGrid } from './enterTheGrid'
import { takeFromTheList } from './takeFromTheList'

// HOME AND END ON THEIR OWN, AND THE FIELD KEEPS THE FIRST PRESS.
//
// The grid was bound for Ctrl and Command with these keys and for nothing bare. Binding them
// outright was the obvious move and it is the wrong one: every cell under the cursor is a real
// input, so Home already means "the front of what I am typing", and a grid that swallows it
// leaves no way back to the front of a price being retyped. v2 never bound them in its item grid
// either — it uses them in menus, in the date grid and along the listing's headings, and leaves
// the grid to the field.
//
// So the caret gets the first press and the grid gets the second. These journeys are about the
// handover, because that is the part a person can get wrong.

async function aLineWithAPrice(page: import('@playwright/test').Page) {
  await enterTheGrid(page)
  await takeFromTheList(page, 'Steel rod', 'Steel rod', 'Item')
  await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('2')
  await page.keyboard.press('Enter')
  const price = page.getByRole('textbox', { name: 'price' })
  await expect(price).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('1234.50')
  return price
}

test('the first Home goes to the front of the text, not out of the cell', async ({ page }) => {
  await page.goto('/?screen=create')
  const price = await aLineWithAPrice(page)

  await page.keyboard.press('Home')

  // STILL IN THE CELL, and the caret is at the front of what was typed. Asked of the caret rather
  // than of the value: the value does not change either way, so a test on the value would pass
  // with the key doing nothing at all.
  await expect(price).toBeFocused()
  expect(await price.evaluate((field: HTMLInputElement) => field.selectionStart)).toBe(0)
})

test('the second Home leaves the cell and lands at the start of the row', async ({ page }) => {
  await page.goto('/?screen=create')
  await aLineWithAPrice(page)

  await page.keyboard.press('Home')
  await page.keyboard.press('Home')

  // The row number, which is the first column. It is not a field, so the cell itself holds the
  // keyboard.
  await expect(await cellUnder(page, 1, '#')).toBeFocused()
})

test('End works the same way round, ending at the last column', async ({ page }) => {
  await page.goto('/?screen=create')
  await aLineWithAPrice(page)

  // The caret is at the end already, having just been typed — so this press is the one that
  // moves. That is the empty-cell case too: a cell with nothing in it is at both ends at once.
  await page.keyboard.press('End')

  // THE LAST COLUMN IS Amount, AND IT IS TYPED INTO — so what holds the keyboard is its field,
  // not the cell around it. Asserting the cell would fail here for the right answer, which is
  // how this test was first written and how it was found out.
  await expect(page.getByRole('textbox', { name: 'amount' })).toBeFocused()
})

test('a selection is not a caret at an end, so Home collapses it instead of leaving', async ({ page }) => {
  await page.goto('/?screen=create')
  const price = await aLineWithAPrice(page)

  // Everything selected. One edge of the selection IS at the front, which is exactly the state a
  // naive check reads as "already there" — and then Home jumps out of a cell somebody had just
  // selected the contents of.
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Home')

  await expect(price).toBeFocused()
  expect(await price.evaluate((field: HTMLInputElement) => field.selectionStart)).toBe(0)
})
