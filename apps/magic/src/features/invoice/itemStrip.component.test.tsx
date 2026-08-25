// What the strip under the grid knows about the line the cursor is on.
//
// THE CASE THAT WAS BROKEN IS THE ONE NOBODY TESTS: an invoice that was OPENED rather than typed.
// Stock, the HSN, the rate and what this customer paid last time are the item master's facts, not
// the line's, so a row from the backend carries none of them — and the strip stayed empty on every
// line. Typing an item in filled it, which is why it looked fine to everyone building it.

import { afterEach, beforeEach, expect, it } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import { settled } from '@busy/ui/settled'
import '../../index.css'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { emptyRow } from '../../data/schema/invoice'
import { useInvoice } from './store'
import { ItemStrip } from './ItemStrip'

let host: HTMLDivElement

beforeEach(async () => {
  host = document.createElement('div')
  document.body.append(host)
  useInvoice.getState().reset()
  mounted(host, <ItemStrip />)
  await settled(() => document.querySelector('[aria-label="Item information"]') !== null)
})

afterEach(() => {
  unmountAll()
  host.remove()
  useInvoice.getState().reset()
})

const strip = () => document.querySelector<HTMLElement>('[aria-label="Item information"]')!.textContent ?? ''

it('shows no profit figure at all until something has been sold', async () => {
  // v2's chip returns null on a sale of zero rather than printing one. Ours read "This bill 0.00"
  // on every empty invoice — a number with no percentage beside it, which says nothing and reads
  // as the strip being broken. A profit of zero on a real invoice is a different answer and shows.
  useInvoice.setState({ showsProfit: true })
  await settled()
  expect(strip()).not.toContain('This bill')

  const items = await data.listItems('')
  if (isRefusal(items)) throw new Error(items.message)
  const item = items[0]!
  useInvoice.getState().load([
    { ...emptyRow('row-0'), itemId: item.id, itemName: item.name, unit: 'PCS', quantity: 1, taxPercent: item.taxPercent, pricePaise: item.pricePaise, amountPaise: item.pricePaise, costPaise: item.costPaise },
  ])
  await settled(() => strip().includes('This bill'))
  expect(strip()).toContain('This bill')
})

it('shows the HSN, the GST rate and the last sale price for an invoice that was opened', async () => {
  // Through the same seam the screen uses, because that is the whole of what was missing: the
  // rows arrive with an itemId and nothing else, and somebody has to go and ask.
  const items = await data.listItems('')
  if (isRefusal(items)) throw new Error(items.message)
  const item = items[0]!

  useInvoice.getState().load([
    { ...emptyRow('row-0'), itemId: item.id, itemName: item.name, unit: 'PCS', quantity: 1, taxPercent: item.taxPercent, pricePaise: item.pricePaise, amountPaise: item.pricePaise },
  ])
  useInvoice.getState().moveTo({ row: 0, column: 'item' })
  await settled()

  // BEFORE THE FACTS ARRIVE THE STRIP IS EMPTY, and that is the state that was shipping.
  expect(strip()).not.toContain('HSN')

  useInvoice.getState().fillItemFacts(items)
  await settled(() => strip().includes('HSN'))

  expect(strip()).toContain('HSN')
  expect(strip()).toContain(item.hsn)
  expect(strip()).toContain('GST')
  expect(strip()).toContain(`${item.taxPercent}%`)
  expect(strip()).toContain('Last rate')
})

it(`does not overwrite what a line already knows with today's catalogue`, async () => {
  const items = await data.listItems('')
  if (isRefusal(items)) throw new Error(items.message)
  const item = items[0]!

  useInvoice.getState().load([
    { ...emptyRow('row-0'), itemId: item.id, itemName: item.name, unit: 'PCS', quantity: 1, taxPercent: item.taxPercent, pricePaise: item.pricePaise, amountPaise: item.pricePaise },
  ])
  useInvoice.getState().applyItem(0, { ...item, stock: 99 })
  await settled()

  // A ROW RECORDS WHAT WAS SOLD, not what the catalogue says now. A later fetch must not quietly
  // replace a figure that was true at the moment of picking.
  useInvoice.getState().fillItemFacts([{ ...item, stock: 4 }])
  await settled()
  useInvoice.getState().moveTo({ row: 0, column: 'item' })
  await settled(() => strip().includes('Stock'))
  expect(strip()).toContain('99')
})
