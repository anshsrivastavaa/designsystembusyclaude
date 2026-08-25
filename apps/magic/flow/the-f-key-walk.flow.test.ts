import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'

// F2 IS "DONE WITH THIS SECTION" and it walks the invoice: party → items → charges → save.
//
// REAL KEY PRESSES, not synthetic events. A dispatched KeyboardEvent proves a handler is wired
// and says nothing about whether the key reaches it — which is the whole question here, because
// the item grid binds F2 for its own purposes and a drawer binds it for another.
//
// THE LAST JUMP SAVES. That is the condition Aj put on the F2 badge staying on the Save button:
// a badge that says F2 saves while F2 only moves the cursor is a control reporting a state it
// is not in, and it would come off. So the last press is asserted on the SAVE HAPPENING.

test('F2 walks from the party to the items to the charges', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()

  await page.keyboard.press('F2')
  await expect(page.getByRole('combobox', { name: 'Item' })).toBeFocused()

  await page.keyboard.press('F2')
  await expect(page.getByRole('table', { name: 'Bill sundry' }).getByRole('combobox').first()).toBeFocused()
})

test('F2 from the charges saves the invoice, rather than pointing at the button', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)

  // An invoice cannot be saved without a party, and being refused is not the thing under test.
  await page.getByRole('combobox', { name: 'Party' }).click()
  await page.getByRole('option').filter({ hasText: 'Sharma Traders' }).first().click()

  await page.getByRole('table', { name: 'Bill sundry' }).getByRole('combobox').first().focus()
  await page.keyboard.press('F2')

  // SAVED, not focused. The bar says what happened, and it carries the number the backend gave
  // back — which is the proof that a save actually ran rather than a button taking the keyboard.
  await expect(page.locator('[aria-label="Invoice actions"]')).toContainText(/saved/i)
})

test('F2 inside a drawer still creates the record, because that is a job you are in the middle of', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await page.getByRole('combobox', { name: 'Party' }).click()
  await page.keyboard.type('Brand New Buyer')
  // Leaving the field with something the search could not find is what opens the drawer — so
  // the list has to have come back with nothing but its own create row first.
  await expect(page.getByRole('option')).toHaveCount(1)
  await page.keyboard.press('Tab')

  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()

  // VISIBLE IS NOT READY, AND THAT COST EIGHT RUNS IN THIRTY. The drawer takes the keyboard onto
  // its own panel as it opens — it has to, or it is something you tab past — and moves it into
  // the first field one frame later. F2 is read by the FORM, which is inside the panel, and a
  // key pressed at the panel never travels inwards to it. So a press landing in that one-frame
  // window is swallowed, the party is never created, and the drawer just sits there until the
  // assertion gives up. Nobody can press inside 16ms; a journey can, and did.
  //
  // Waiting for the field F2 is meant to act on is the same wait openInvoice makes for rows:
  // assert the thing that has to be true, never sleep until it usually is.
  await expect(drawer.getByRole('textbox', { name: 'Name' })).toBeFocused()

  await page.keyboard.press('F2')

  // The drawer created the party and closed. If the section walk had taken the key, the drawer
  // would still be open and the keyboard would be somewhere on the invoice behind it.
  await expect(drawer).toBeHidden()
  await expect(page.getByRole('combobox', { name: 'Party' })).toHaveValue('Brand New Buyer')
})
