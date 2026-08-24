import { expect, test, type Locator, type Page } from '@playwright/test'

// THE PRODUCT ANSWERS WHEN YOU TOUCH IT — asserted with a real mouse, on the rendering.
//
// IT HAS TO BE A REAL PRESS. `:active` answers to the browser's own idea of a held pointer, and
// a dispatched pointerdown does not set it. Written first as a component test with synthetic
// events, all three assertions failed against a utility that was working perfectly — the same
// shape as a forced click, which says the handler ran and says nothing about whether a person
// could reach the thing.
//
// WHICH PROPERTY. `pressable` is authored with `transform: scale(0.97)`, so the browser reports
// it on `transform`. Tailwind's own `scale-*` writes to the STANDALONE `scale` property, which
// `transition-property: transform` does not cover — a utility written that way would jump rather
// than ease, and a test reading `transform` would read an empty string for ever and pass
// whatever the element did. That trap already cost this build an afternoon on the chevron.
//
// AT REST AS WELL AS PRESSED. Reading only the held state would pass on an element that was
// permanently scaled, which is not an affordance, it is a mistake.

const AT_REST = 'none'
const PRESSED = 'matrix(0.97, 0, 0, 0.97, 0, 0)'

const transformOf = (thing: Locator) => thing.evaluate((el) => getComputedStyle(el).transform)

async function pressAndHold(page: Page, thing: Locator) {
  const box = await thing.boundingBox()
  if (box === null) throw new Error('nothing to press')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  // Long enough for a 0.12s transition to finish, short enough not to be a long press.
  await page.waitForTimeout(300)
  const seen = await transformOf(thing)
  await page.mouse.up()
  return seen
}

test('a button is still, and gives way while it is held', async ({ page }) => {
  await page.goto('/')
  const newInvoice = page.getByRole('button', { name: 'New N' })

  expect(await transformOf(newInvoice)).toBe(AT_REST)
  expect(await pressAndHold(page, newInvoice)).toBe(PRESSED)
})

test('it eases rather than snapping — caught in the middle of the press', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: 'New N' })

  // `transition-colors pressable` on one element is not two transitions, it is a fight over the
  // single `transition-property` an element gets — and the colours won, so the press snapped
  // while every other assertion here stayed green. The utility owns the whole list now.
  const property = await button.evaluate((el) => getComputedStyle(el).transitionProperty)
  expect(property.split(', ')).toContain('transform')

  // And it is watched happening rather than read off a number. Sampled a fraction of the way
  // into a press, the button is neither where it started nor where it is going — which is what
  // "eases" means, and is the one claim a stylesheet cannot fake. How LONG it takes is the token
  // layer's business and is not repeated here.
  const box = (await button.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  const midway = await button.evaluate(
    (el) => new Promise<string>((done) => setTimeout(() => done(getComputedStyle(el).transform), 30)),
  )
  await page.mouse.up()

  expect(midway).not.toBe(AT_REST)
  expect(midway).not.toBe(PRESSED)
})

test('a tab in the status strip gives way', async ({ page }) => {
  await page.goto('/')
  const pending = page.getByRole('radio', { name: /Pending/ })

  expect(await transformOf(pending)).toBe(AT_REST)
  expect(await pressAndHold(page, pending)).toBe(PRESSED)
})

test('a row is deliberately still, because three per cent of a full-width row is twenty pixels', async ({ page }) => {
  await page.goto('/')
  const row = page.locator('tbody tr').nth(2)

  // Measured at 900px wide: a pressable row moved its first cell 14px sideways. A button giving
  // way reads as a button listening; a whole row sliding under the cursor reads as a mis-click.
  expect(await transformOf(row)).toBe(AT_REST)
  expect(await pressAndHold(page, row)).toBe(AT_REST)
})
