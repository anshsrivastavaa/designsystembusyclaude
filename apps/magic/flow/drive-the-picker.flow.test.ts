import { expect, type Page, test } from '@playwright/test'

import { enterTheGrid } from './enterTheGrid'

// The three that stopped the screen being driveable.

/** How far the list has been scrolled. The panel itself does not scroll — the region between
 * its top and its pinned foot does — so this asks that region. */
async function listBottom(page: Page) {
  return page.evaluate(() => {
    const list = document.querySelector('[role="listbox"]')
    if (!list) return -1
    const scroller = [...list.querySelectorAll('div')].find((box) => box.scrollHeight > box.clientHeight)
    return scroller ? Math.round(scroller.scrollTop) : 0
  })
}

test('scrolling inside the open list does not close it', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)
  await page.keyboard.type('e')

  const list = page.getByRole('listbox', { name: 'Item' })
  await expect(list).toBeVisible()
  await expect(page.getByRole('option').nth(8)).toBeAttached()

  await list.hover()
  await page.mouse.wheel(0, 200)
  await page.waitForTimeout(200)

  await expect(list).toBeVisible()
  expect(await listBottom(page)).toBeGreaterThan(0)
})

test('arrowing down carries the list along instead of stopping at the last one in view', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)
  await page.keyboard.type('e')
  await expect(page.getByRole('listbox', { name: 'Item' })).toBeVisible()
  await expect(page.getByRole('option').nth(12)).toBeAttached()

  for (let step = 0; step < 12; step += 1) await page.keyboard.press('ArrowDown')

  // The highlighted row has to be on the screen, not somewhere below the fold of the list.
  const highlighted = page.getByRole('option', { selected: true })
  await expect(highlighted).toBeInViewport()
  expect(await listBottom(page)).toBeGreaterThan(0)
})

test('Enter from Unit on the last row lands somewhere instead of losing the keyboard', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)

  // A brand new item: type it, pick it, then tab across to Unit and type one.
  await page.keyboard.type('Steel rod')
  await expect(page.getByRole('option').filter({ hasText: 'Steel rod' }).first()).toBeVisible()
  await expect(page.getByRole('option')).toHaveCount(8)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()

  // Unit has left the tab order for this row, because the item arrived with one. The arrows
  // always reach it, which is the half of that ruling this exercises.
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('textbox', { name: 'unit' })).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('BOX')

  await page.keyboard.press('Enter')

  // The keyboard is in the row below — not nowhere, which is where it used to go.
  await expect(page.getByRole('row').nth(2).getByRole('combobox', { name: 'Item' })).toBeFocused()
})
