// Splitting an invoice, measured on the rendering.
//
// The arithmetic is tested without a browser in splitSchedule.logic.test.ts. What is here is what
// that cannot answer: that the top row re-spreads the table live, that it STOPS once a row has been
// edited by hand, and that a split invoice refuses a new line.

import { afterEach, beforeEach, expect, it } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import { settled } from '@busy/ui/settled'
import '../../index.css'
import { emptyRow } from '../../data/schema/invoice'
import type { Item } from '../../data/schema/item'
import { useInvoice } from './store'
import { Breakdown } from './Breakdown'

let host: HTMLDivElement

const anItem: Item = {
  id: 'item-1', name: 'Bolt', alias: '', barcode: '', hsn: '7318', pricePaise: 500_00, taxPercent: 18,
  units: [{ code: 'PCS', label: 'Pieces' }], defaultUnit: 'PCS', stock: 10, lastRatePaise: 500_00, listRatePaise: 500_00,
  mrpPaise: 600_00, costPaise: 300_00, taxTreatment: 'taxable', cessPercent: 0,
}

beforeEach(async () => {
  host = document.createElement('div')
  document.body.append(host)
  useInvoice.getState().reset()
  useInvoice.getState().load([
    { ...emptyRow('row-0'), itemId: 'item-0', itemName: 'Bolt', quantity: 1, pricePaise: 30_000_00, amountPaise: 30_000_00 },
    emptyRow('row-1'),
  ])
  mounted(host, <Breakdown />)
  await settled(() => document.querySelector('[aria-label="Invoice breakdown"]') !== null)
})

afterEach(() => {
  unmountAll()
  host.remove()
  useInvoice.getState().reset()
})

const openSplit = async () => {
  const door = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (one) => one.textContent?.trim().startsWith('Split') === true,
  )!
  door.click()
  await settled(() => document.querySelector('[role="dialog"]') !== null)
}

/** Types into a real field the way a person does.
 *
 * REACT IGNORES A DIRECTLY-SET `.value`. It remembers the last value it wrote and treats an
 * unchanged one as no change, so `node.value = '4'` followed by an input event updates the DOM and
 * nothing else — the test then measures a screen that never heard the keystroke. Going through the
 * prototype's own setter is what makes React see it. */
const typeInto = (node: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  setter.call(node, value)
  node.dispatchEvent(new Event('input', { bubbles: true }))
}

const amounts = () =>
  [...document.querySelectorAll<HTMLInputElement>('input[aria-label^="Amount for part"]')].map((box) => box.value)

it('opens on a schedule rather than on an empty table', async () => {
  // v2 seeds its first part with the whole amount for this reason: an empty table's only possible
  // answer is a refusal, and a surface that opens by refusing is one nobody presses twice.
  await openSplit()
  expect(amounts().length).toBeGreaterThan(0)
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('All of it is placed')
})

it('re-spreads the table live when the top row changes, with no Generate', async () => {
  await openSplit()
  const parts = document.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!
  typeInto(parts, '4')
  await settled(() => amounts().length === 4)
  expect(amounts()).toEqual(['7,500.00', '7,500.00', '7,500.00', '7,500.00'])
})

it('stops re-spreading once a row has been edited by hand', async () => {
  await openSplit()
  const first = document.querySelector<HTMLInputElement>('input[aria-label="Amount for part 1"]')!
  typeInto(first, '5000')
  await settled(() => amounts()[0] === '5,000.00')

  // TAKEN FROM v2, WHICH HAS NO GENERATOR AT ALL: a hand-made schedule is never re-spread. The
  // figures are what somebody agreed with a customer, and nudging the gap afterwards must not
  // rewrite them.
  const parts = document.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!
  typeInto(parts, '5')
  await settled()
  expect(amounts()[0]).toBe('5,000.00')
  expect(amounts()).toHaveLength(2)
  // And it says so, rather than the control silently doing nothing.
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('edited by hand')
})

it('says what is still to place, and refuses nothing else', async () => {
  await openSplit()
  const first = document.querySelector<HTMLInputElement>('input[aria-label="Amount for part 1"]')!
  typeInto(first, '0')
  await settled(() => document.querySelector('[role="dialog"]')?.textContent?.includes('Still to place') === true)
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('15,000.00')
})

it('refuses a new line while the invoice is split, and names the way out', async () => {
  await openSplit()
  await settled(() => useInvoice.getState().splitParts.length > 1)

  useInvoice.getState().applyItem(1, anItem)
  await settled()
  expect(useInvoice.getState().rows[1]?.itemId).toBeNull()
  expect(useInvoice.getState().asking?.message).toContain('Remove the split')

  // AND THE WAY OUT WORKS. A refusal naming a control that does not undo it would be worse than
  // the refusal.
  useInvoice.getState().clearSplit()
  useInvoice.getState().applyItem(1, anItem)
  await settled()
  expect(useInvoice.getState().rows[1]?.itemId).toBe('item-1')
})
