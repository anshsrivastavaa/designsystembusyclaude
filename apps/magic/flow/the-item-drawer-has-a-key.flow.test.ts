import { expect, test } from '@playwright/test'

import { enterTheGrid } from './enterTheGrid'

// F10 OPENS THE ITEM DRAWER ON WHAT HAS BEEN TYPED, and before this it had no keyboard door at
// all: it opened from the list's "+ Create item" row and from nowhere else, which is a mouse-only
// path to the one place an item gets a unit, a tax category and an HSN.
//
// A REAL KEY PRESS ON A REAL CELL. The cap is not a control and is never clicked — pressing a
// shortcut hint is not how a shortcut is used — so the only honest way to reach this is the key.

test('F10 in the item cell opens the drawer carrying what was typed', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)

  await page.keyboard.type('Brass hinge 40mm')
  await page.keyboard.press('F10')

  const drawer = page.getByRole('dialog', { name: /item/i })
  await expect(drawer).toBeVisible()
  // IT CARRIES THE TYPING ACROSS. A drawer that opens empty makes the person type the name twice,
  // which is the whole reason the create row hands its text over too.
  await expect(drawer.getByRole('textbox').first()).toHaveValue('Brass hinge 40mm')
})

test('the cap shows only while the cell has the keyboard, and is not in the tab order', async ({ page }) => {
  await page.goto('/?screen=create')

  // SCOPED TO THE CELL, because the party field wears an F10 cap too and an unscoped locator
  // answers with whichever the browser reaches first — a journey that meant one and measured the
  // other is not a slower version of the same check.
  const cap = page.getByRole('gridcell').filter({ has: page.getByRole('combobox', { name: 'Item' }) }).locator('kbd')

  await enterTheGrid(page)
  await expect(cap).toBeVisible()

  // POLLED, NOT READ ONCE. `toBeVisible` ignores opacity — this build has been caught by that
  // three times — so the opacity is asked directly; and the cap FADES in, so a single read lands
  // mid-transition at whatever the browser had painted by then. Read once, this said 0 while the
  // cap was plainly on its way to 1.
  await expect.poll(() => cap.evaluate((node) => Number(getComputedStyle(node).opacity))).toBeGreaterThan(0.9)

  const seen = await cap.evaluate((node) => ({
    pointerEvents: getComputedStyle(node).pointerEvents,
    tabIndex: (node as HTMLElement).tabIndex,
  }))
  expect(seen.pointerEvents).toBe('none')
  expect(seen.tabIndex).toBeLessThan(0)
})

// TAB AND ENTER ARE UNCHANGED, which is the half of this that was asked for and withdrawn. A name
// matching nothing carries on into the line and the item is created when the line is saved —
// Aj's 20-08 ruling, re-asked on 25-08 and withdrawn once it was shown to reverse itself.
test('a name that matches nothing still walks straight into the line, with no drawer', async ({ page }) => {
  await page.goto('/?screen=create')
  await enterTheGrid(page)

  await page.keyboard.type('Nothing matches this at all')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('textbox', { name: 'quantity' })).toBeFocused()
})
