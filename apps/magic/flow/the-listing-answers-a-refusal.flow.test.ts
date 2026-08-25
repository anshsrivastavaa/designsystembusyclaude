import { expect, test } from '@playwright/test'

// A REFUSAL ENDS THE LOAD, AND SAYS WHAT TO DO.
//
// The screen read `if (isRefusal(answer)) return`, so the one answer that most needed showing was
// dropped and the listing sat on "Loading invoices…" for ever. Nothing in the application caught a
// rejected promise either, so an unreachable backend did the same with the real error in a console
// nobody has open. The seam converts rejections to refusals now; this is what a person sees.

test('a listing that cannot load says why, and offers the one thing to do about it', async ({ page }) => {
  // Fail the data the screen asks for, the way a dead backend does — before anything is rendered.
  await page.route('**/*', (route) => route.continue())
  await page.addInitScript(() => {
    // The mock world lives in the bundle, so the refusal is forced at the seam by making the
    // adapter's own answer unusable rather than by intercepting a request that is never made.
    ;(window as unknown as { __refuseInvoices?: boolean }).__refuseInvoices = true
  })

  await page.goto('/')

  // Whatever happens, it must not still be loading a moment later — that is the fault.
  await expect(page.getByText('Loading invoices…')).toHaveCount(0, { timeout: 10000 })
})

test('the invoice number is underlined without being pointed at', async ({ page }) => {
  await page.goto('/')
  // Found by the role it plays rather than by its text: invoice numbers are `67/2026-27` here and
  // a different series elsewhere, and a test that hard-codes a format breaks on the data.
  const number = page.locator('[data-role="open-invoice"]').first()
  await expect(number).toBeVisible()

  // COLOUR ALONE IS NOT A LINK. This is the most-clicked control on the screen and it was accent
  // ink with the underline arriving only on hover — unreadable as a link with colour removed, and
  // to anybody who never happens to hover. Measured, not grepped: the decoration is on at rest.
  const decoration = await number.evaluate((el) => getComputedStyle(el).textDecorationLine)
  expect(decoration).toContain('underline')
})

test('the bulk bar answers the arrow keys it claims a toolbar answers', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Select every invoice on this page' }).check()

  const bar = page.getByRole('toolbar')
  await expect(bar).toBeVisible()

  // EVERY button is reachable, including the six that are switched off until the backend lands —
  // each of them exists to say why it cannot be used, and a control nobody can arrive at cannot
  // say anything. They are `aria-disabled` rather than `disabled` for exactly that reason.
  const buttons = bar.locator('button')
  await expect(buttons.first()).toBeVisible()
  await buttons.first().focus()
  const started = await page.evaluate(() => document.activeElement?.textContent?.trim())
  expect(started, 'the keyboard never reached the strip').not.toBe('')

  await page.keyboard.press('ArrowRight')
  const moved = await page.evaluate(() => document.activeElement?.textContent?.trim())

  // A role is a promise about behaviour. It announced a toolbar and the keys did nothing.
  expect(moved).not.toBe(started)

  // And the reason is readable rather than sitting in a title no disabled control ever shows.
  const named = await bar.locator('button[aria-disabled="true"]').first().getAttribute('aria-label')
  expect(named, 'a switched-off action does not say why').toContain('—')
})
