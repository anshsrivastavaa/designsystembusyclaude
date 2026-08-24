import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'

import { cellUnder } from './cells'
import { takeFromTheList } from './takeFromTheList'

// Two things Aj found on the running screen, and the tests that would have caught them.

test('picking a party puts the cursor in the first item cell', async ({ page }) => {
  await page.goto('/?screen=create')

  // Keyboard alone. The list is already open, because this field is where an invoice begins.
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await takeFromTheList(page, 'Sharma T', 'Sharma Traders')

  // Picking a party is the end of that step and the beginning of the next one. Leaving the
  // cursor in the party field leaves it with nothing to do.
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()
  await expect(page.getByRole('row').nth(1).getByRole('combobox', { name: 'Item' })).toBeFocused()
})

test('picking a party moves the cursor even when the grid has already been used', async ({ page }) => {
  await page.goto('/?screen=create')
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await page.keyboard.press('Escape')

  // THE PATH THE JOURNEY ABOVE NEVER WALKED, and the reason it stayed green over a behaviour
  // that had gone. It only ever exercises the FIRST time the grid is engaged, and on that
  // first time `gridEngaged` flips from false to true and drags the focus effect along with
  // it. Touch the grid once and that never changes again — so picking a party placed the
  // cursor on a cell it was already on, nothing about the position changed, and the keyboard
  // stayed in the party field.
  const grid = page.getByRole('grid', { name: 'Invoice items' })
  await (await cellUnder(page, 1, 'Item Name')).click()
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()

  await page.getByRole('combobox', { name: 'Party' }).click()
  await takeFromTheList(page, 'Sharma T', 'Sharma Traders')

  await expect(grid.getByRole('row').nth(1).getByRole('combobox', { name: 'Item' })).toBeFocused()
})

test('every row is numbered, including the one the cursor is on', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.keyboard.press('Escape')

  // The row number steps aside for the delete control, and an EMPTY row has nothing to delete
  // — so it has no control, and the number was stepping aside for nothing. On a blank invoice
  // the cursor sits on row one, so row one was the one row with no number at all.
  const numbers = page.getByRole('grid', { name: 'Invoice items' }).getByRole('row')
  for (const at of [1, 2, 3]) {
    const gutter = numbers.nth(at).getByRole('gridcell').first()
    await expect(gutter).toHaveText(String(at))
    // OPACITY, not toBeVisible(). Present in the markup is not the same as on the screen: the
    // number was there all along at zero opacity, and toBeVisible() does not look at opacity —
    // it passed over the planted break. That is the second time that matcher has stood in for
    // "on the screen" and been wrong here; the first was a list clipped to nothing.
    await expect(gutter.locator('span').first()).toHaveCSS('opacity', '1')
  }
})

test('the screen is one scrolling column, and the headings stay while everything else travels', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=2000', 3)
  // Wait for the invoice to actually arrive. The grid fills itself the moment it is drawn, so
  // rows appear long before the two thousand do — and arrowing down a short grid scrolls
  // nothing, which is a passing test of the wrong screen.
  await expect(page.getByRole('grid', { name: 'Invoice items' }).getByText('2000 lines')).toBeVisible()

  await page.keyboard.press('Escape')
  await (await cellUnder(page, 1, 'Item Name')).click()
  // Enough presses to travel well past the fold, and no more. Sixty was chosen when the grid
  // had six columns; at ten it is thirty seconds of a thirty-second budget, and a journey that
  // is mostly waiting is a journey nobody runs.
  for (let step = 0; step < 25; step += 1) await page.keyboard.press('ArrowDown')

  // REVERSES THE 20-08 RULING ON THIS SCREEN, deliberately. It used to be that the grid
  // scrolled inside itself so the party field and the totals never moved. v2 calls a table's
  // inner scroll a regression in those words, and Aj settled it there: the screen is ONE
  // scrolling column. So the party field and the breakdown are now expected to travel off the
  // top, and the thing that must not move is the column headings.
  await expect(page.getByRole('columnheader', { name: '#' })).toBeInViewport()

  // The cursor is on screen — asking this separately is what tells scrolling apart from
  // hiding, because a grid that CLIPS its rows also keeps everything above it in place.
  await expect(page.locator(':focus')).toBeInViewport()

  // Exactly one thing scrolled, and it is the screen. A second scroller inside it is two
  // scrollbars and a guess about which one the wheel is on.
  const scrolling = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('main, main *')].filter((box) => {
      const style = getComputedStyle(box)
      return box.scrollHeight > box.clientHeight + 4 && ['auto', 'scroll'].includes(style.overflowY)
    })
    return boxes.map((box) => box.tagName)
  })
  expect(scrolling).toEqual(['MAIN'])

  // And the grid itself has no travel of its own left at all.
  const gridScrolls = await page.evaluate(() => {
    const grid = document.querySelector('[role="grid"][aria-label="Invoice items"]')!
    return grid.scrollHeight > grid.clientHeight + 4
  })
  expect(gridScrolls).toBe(false)
})

test('holding the down arrow does not grow the invoice', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.keyboard.press('Escape')
  await page.getByRole('row').nth(1).getByRole('gridcell').nth(1).click()

  const before = await page.getByRole('row').count()
  for (let step = 0; step < 30; step += 1) await page.keyboard.press('ArrowDown')

  // Empty rows are there to be typed into, not created by walking over them. Counted from the
  // filled rows and not from the cursor, or thirty presses adds twenty rows.
  expect(await page.getByRole('row').count()).toBe(before)
  await expect(await cellUnder(page, 1, 'Item Name')).toHaveText('')
})

test('a new invoice starts empty, and does not hold the last one', async ({ page }) => {
  await page.goto('/')

  // Fill in enough to be unmistakable: a party, and a line.
  await page.getByRole('button', { name: /New/ }).first().click()
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
  await takeFromTheList(page, 'Sharma T', 'Sharma Traders')
  await page.keyboard.type('Steel rod')
  // The ITEM list, not whichever list happens to be open — the party list is still on screen
  // for a moment after picking, and asserting "an option is visible" was satisfied by it.
  await expect(page.getByRole('listbox', { name: 'Item' })).toBeVisible()
  await page.keyboard.press('Enter')
  // The cell, not a combobox: picking an item moves the cursor on to Qty, so the Item cell is
  // read-only text by the time anybody looks at it.
  await expect(await cellUnder(page, 1, 'Item Name')).toHaveText(/Steel rod/)

  // Away and back, the way a person does it.
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: /New/ }).first().click()

  // THE STORE OUTLIVES THE SCREEN. Nothing cleared it unless `?rows=N` was on the address, so
  // the second invoice of the day opened with the first customer's name and lines on it —
  // which is the first thing anybody clicking around meets.
  await expect(page.getByRole('combobox', { name: 'Party' })).toHaveValue('')
  await expect(await cellUnder(page, 1, 'Item Name')).toHaveText('')
})

test('the action bar never covers the last line of the breakdown', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await page.keyboard.press('Escape')
  await page.getByRole('region', { name: 'Invoice breakdown' }).scrollIntoViewIfNeeded()

  // NOT toBeVisible — that passes over an element with something painted on top of it, which
  // is exactly the failure here. This asks the question a finger asks: if I put it on the
  // Grand Total, what do I touch?
  const covered = await page.evaluate(() => {
    const card = document.querySelector('[aria-label="Invoice breakdown"]')!
    const total = [...card.querySelectorAll('span')].find((n) => n.textContent?.trim() === 'Grand Total')!
    const box = total.getBoundingClientRect()
    const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    if (at === null) return 'nothing is there — it is off screen'
    if (at.closest('[aria-label="Invoice actions"]') !== null) return 'the action bar is over it'
    return card.contains(at) ? 'the breakdown card' : `something else: ${at.tagName}`
  })
  expect(covered).toBe('the breakdown card')
})

test('leaving the invoice hands the keyboard to the screen that arrives', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()

  // Back is a control INSIDE the invoice, so pressing it takes away the thing holding the
  // keyboard. The invoice's own net cannot help — it goes with the invoice — and the keyboard
  // landed on the page body: the listing looked normal and answered no key at all. The fuzz
  // journey found it at press 100, by tabbing to Back and pressing Enter.
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('button', { name: /New/ }).first()).toBeVisible()

  const holder = await page.evaluate(() => {
    const active = document.activeElement
    if (active === null || active === document.body) return 'the page body'
    if (document.querySelector('main')?.contains(active) !== true) return `outside the screen: ${active.tagName}`
    const usable = active.tagName === 'INPUT' || active.tagName === 'BUTTON' || active.tagName === 'SELECT'
    return usable ? 'a control on the listing' : `parked on a ${active.tagName} that is not a control`
  })
  expect(holder).toBe('a control on the listing')
})

test('exactly one cell on the cursor row is wearing a state', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await page.keyboard.press('Escape')
  await (await cellUnder(page, 1, 'Qty')).click()

  // A RING MEANS "THIS CELL IS IN A STATE", and it may not mean anything else. Every editable
  // cell on the cursor row was drawing its own grey ring, so four cells looked like they were
  // in a state and one was — and an error ring arriving on that row would have been competing
  // with three ornaments for the same meaning.
  //
  // NOT toBeVisible, and not a class name. A grey ring on a grey fill has a box and passes
  // toBeVisible while being invisible to a person, which is the same failure wearing the other
  // coat. This reads what the browser actually painted.
  //
  // The column separators are excluded on purpose: every cell carries a hairline on its right
  // edge and that is the table's own ruling, not a state. What is counted is a mark that goes
  // ROUND a cell — an outline, or a ring, which Tailwind paints as an inset shadow.
  const wearing = await page.evaluate(() => {
    const row = document.querySelector('[role="row"][aria-rowindex="2"]')
    if (row === null) return ['no row']
    return [...row.querySelectorAll('[role="gridcell"]')]
      .filter((cell) => {
        const style = getComputedStyle(cell)
        const outlined = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
        const ringed = style.boxShadow !== 'none' && style.boxShadow !== ''
        return outlined || ringed
      })
      .map((cell) => cell.textContent?.trim() || cell.querySelector('input')?.getAttribute('aria-label') || '?')
  })

  expect(wearing.length, `these cells all look like they are in a state: ${JSON.stringify(wearing)}`).toBe(1)
})
