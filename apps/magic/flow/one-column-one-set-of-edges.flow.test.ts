// Everything full-width on the invoice starts and ends in the same two places.
//
// MEASURED, NOT EYEBALLED. Three cards with three right edges is the kind of thing that is
// obvious in a screenshot and invisible while you are building any one of them — the header plane
// ran sixteen pixels proud of the item grid on both sides for as long as both existed, because
// they were laid out under two different models: the plane is a card with its own padding hung off
// the scrolling column, and everything below is a card inside a padded container.

import { expect, test } from '@playwright/test'

import { openInvoice } from './invoice'

test('the header, the item table and the action bar share one set of edges', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=3', 3)
  await page.keyboard.press('Escape')

  const edges = await page.evaluate(() => {
    const main = document.querySelector('main')!
    const of = (node: Element | null) => {
      if (node === null) return null
      const box = node.getBoundingClientRect()
      return { left: Math.round(box.left), right: Math.round(box.right) }
    }
    return {
      header: of(main.querySelector(':scope > div')),
      grid: of(document.querySelector('[role="grid"][aria-label="Invoice items"]')),
      footer: of(main.querySelector('footer')),
      bar: of(document.querySelector('[aria-label="Invoice actions"]')),
    }
  })

  // ONE OBJECT COMPARED WHOLE rather than four assertions, so a failure names every edge at once
  // and says which one is the odd one — reading "expected 1412 to be 1396" four times over tells
  // you there is a problem and not where it is.
  const { grid } = edges
  expect(edges).toEqual({ header: grid, grid, footer: grid, bar: grid })
})
