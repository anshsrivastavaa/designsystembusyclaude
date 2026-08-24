import { expect, test } from '@playwright/test'

// THE TITLE CHANGES WHAT THE DOCUMENT IS, and until now it did nothing at all.
//
// The control wore `aria-haspopup="menu"` and a hard-coded `aria-expanded={false}` with no
// onClick behind it: it announced a menu that could not open. So the first thing walked here is
// that the announcement is TRUE — expanded says false, then true, then false again — because a
// control reporting a state it is not in is the fault this replaced.
//
// REAL KEY PRESSES AND REAL CLICKS. A forced click would skip the hit test and say nothing about
// whether the title is reachable, and the title is an h1 inside a button, which is exactly the
// shape that can end up unclickable.
//
// THE TRIGGER IS ASKED FOR BY A NAME THAT CONTAINS THE VISIBLE WORD. Named only by its contents
// it was "Invoice", which is what the document is rather than what the button does — so the name
// carries both, and this journey would not find it if that ever went back.

test('the title opens the switcher, and says so while it is open', async ({ page }) => {
  await page.goto('/?screen=create')

  const title = page.getByRole('button', { name: /switch voucher type/i })
  await expect(title).toHaveAttribute('aria-expanded', 'false')

  await title.click()

  const menu = page.getByRole('menu', { name: 'Change voucher type' })
  await expect(menu).toBeVisible()
  await expect(title).toHaveAttribute('aria-expanded', 'true')
})

test('it offers the four types you are not on, and never the one you are', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('button', { name: /switch voucher type/i }).click()

  const menu = page.getByRole('menu', { name: 'Change voucher type' })
  await expect(menu.getByRole('menuitem')).toHaveText([
    'Switch to Sale Return',
    'Switch to Quotation',
    'Switch to Order',
    'Switch to Challan',
  ])
})

test('picking one changes what the document is called', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('button', { name: /switch voucher type/i }).click()

  const menu = page.getByRole('menu', { name: 'Change voucher type' })
  // The first item takes the keyboard when the panel opens, so waiting for that is waiting for
  // the panel to be ready rather than merely present — the lesson the F2 drawer race taught.
  await expect(menu.getByRole('menuitem').first()).toBeFocused()

  await menu.getByRole('menuitem', { name: 'Switch to Quotation' }).click()

  await expect(menu).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quotation')
  // And the way back is in the list now that it is not the one you are on.
  await page.getByRole('button', { name: /switch voucher type/i }).click()
  await expect(page.getByRole('menuitem', { name: 'Switch to Invoice' })).toBeVisible()
})

test('the arrows walk the menu and wrap, and Escape hands the keyboard back', async ({ page }) => {
  await page.goto('/?screen=create')
  const title = page.getByRole('button', { name: /switch voucher type/i })
  await title.focus()
  await page.keyboard.press('Enter')

  const items = page.getByRole('menu', { name: 'Change voucher type' }).getByRole('menuitem')
  await expect(items.first()).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await expect(items.nth(1)).toBeFocused()

  // Up from the first wraps to the last rather than falling out of the panel, which is where a
  // menu this short stops being a list and starts being a ring.
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await expect(items.last()).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu', { name: 'Change voucher type' })).toBeHidden()
  await expect(title).toBeFocused()
})
