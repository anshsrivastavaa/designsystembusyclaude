// The address bar and the back button, which are controls whether or not anybody built them.
//
// The first click on New moved the screen and left the address on the listing. From there back
// did nothing — the browser had nowhere to go — and a refresh reopened whichever screen the
// stale address still named. Every window in every browser has those two controls at the top,
// and a screen that ignores them is not offering fewer features, it is lying about two it
// already has.
//
// This does not claim a refresh keeps an unsaved invoice. It keeps the SCREEN.

import { expect, test } from '@playwright/test'

const onTheListing = (page: import('@playwright/test').Page) =>
  expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()

// SAVE IS A SPLIT BUTTON. Its face carries the F2 badge inside it, so the accessible name is not
// the bare word — matched on the start of it rather than exactly, which also keeps the caret's own
// name ("What happens when you save") out of the way.
const onTheInvoice = (page: import('@playwright/test').Page) =>
  expect(page.getByRole('button', { name: /^Save/ })).toBeVisible()

test('the address follows the screen, and back brings you home', async ({ page }) => {
  await page.goto('/')
  await onTheListing(page)

  await page.getByRole('button', { name: 'New' }).click()
  await onTheInvoice(page)
  expect(page.url()).toContain('screen=create')

  await page.goBack()
  await onTheListing(page)

  await page.goForward()
  await onTheInvoice(page)
})

test('a refresh reopens the screen you were on, not the one you started from', async ({ page }) => {
  await page.goto('/')
  await onTheListing(page)

  await page.getByRole('button', { name: 'New' }).click()
  await onTheInvoice(page)

  await page.reload()
  await onTheInvoice(page)
})

test('the rail takes you back to the listing, and the address says so', async ({ page }) => {
  await page.goto('/?screen=create')
  await onTheInvoice(page)

  await page.getByRole('button', { name: 'Sales' }).click()
  await onTheListing(page)
  expect(page.url()).toContain('screen=listing')
})
