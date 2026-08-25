import { expect, test } from '@playwright/test'

import { cellUnder } from './cells'
import { enterTheGrid } from './enterTheGrid'
import { takeFromTheList } from './takeFromTheList'

// TYPING `5k` INTO A PRICE, AS A PERSON DOES IT.
//
// This is the journey the fault would have failed. `5k` reached `toPaise`, where `Number('5k')`
// is NaN, and the guard turned NaN into zero — so the cell said 5k, the line said 0.00, and
// nothing anywhere said why. The logic tier holds the arithmetic; this holds the part the logic
// tier cannot see, which is that real key presses reach it and the screen shows the answer.
//
// REAL KEY PRESSES THROUGHOUT. The refusal half of this is specifically about what a keystroke
// does, so a journey that set a value another way would be asking a different question.

async function priceIn(page: import('@playwright/test').Page, line: number) {
  return cellUnder(page, line, 'Price')
}

test('typing 5k into a price is five thousand rupees, not nothing', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)
  await takeFromTheList(page, 'Steel rod', 'Steel rod', 'Item')

  await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('1')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('textbox', { name: 'price' })).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('5k')
  await page.keyboard.press('Enter')

  // Read off the cell at rest, which is the figure a person actually sees.
  await expect(await priceIn(page, 1)).toContainText('5,000.00')
})

test('5l and 5cr are lakh and crore, read off the line they make', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)
  await takeFromTheList(page, 'Steel rod', 'Steel rod', 'Item')

  await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('1')
  await page.keyboard.press('Enter')

  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('5l')
  await page.keyboard.press('Enter')
  await expect(await priceIn(page, 1)).toContainText('5,00,000.00')

  // Back into the same cell and over the top of it, so the second shorthand is not reading the
  // first one's leftovers.
  ;(await priceIn(page, 1)).click()
  await expect(page.getByRole('textbox', { name: 'price' })).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('5cr')
  await page.keyboard.press('Enter')
  await expect(await priceIn(page, 1)).toContainText('5,00,00,000.00')
})

test('every other letter simply does not go in', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)
  await takeFromTheList(page, 'Steel rod', 'Steel rod', 'Item')

  await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('1')
  await page.keyboard.press('Enter')

  const price = page.getByRole('textbox', { name: 'price' })
  await expect(price).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('5')
  // The letters that are dangerous rather than merely wrong: JavaScript reads each of these as
  // a number, so before the refusal they would have reached the store as a figure nobody typed.
  await page.keyboard.type('e')
  await page.keyboard.type('x')
  await page.keyboard.type('m')

  // THE FIELD NEVER SHOWED THEM. Asserting the stored price would pass even if the cell had
  // displayed "5exm" and thrown it away on blur, which is exactly the lie being guarded against.
  await expect(price).toHaveValue('5')
})

test('a quantity takes no shorthand at all, because it is a count of things', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)
  await takeFromTheList(page, 'Steel rod', 'Steel rod', 'Item')

  const quantity = page.getByRole('textbox', { name: 'quantity' })
  await expect(quantity).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('5k')
  await expect(quantity).toHaveValue('5')
})
