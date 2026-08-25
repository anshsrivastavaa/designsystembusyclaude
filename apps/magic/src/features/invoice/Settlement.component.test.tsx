// The settlement panel, measured on the rendering.
//
// The arithmetic is tested without a browser in settlementSums.logic.test.ts. What is here is
// the part that arithmetic cannot answer: that a tick reaches a figure, that the tendered field
// exists for cash and for nothing else, and that the labels are the two ruled words.

import { afterEach, beforeEach, expect, it } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import { settled } from '@busy/ui/settled'
import '../../index.css'
import { emptyRow } from '../../data/schema/invoice'
import type { Party } from '../../data/schema/party'
import { useInvoice } from './store'
import { Breakdown } from './Breakdown'

let host: HTMLDivElement

/** The party the mock ledger hangs its four credit types off. Written out here rather than
 * imported from `data/mock/`, which only `data/source.ts` may reach into — the id is the whole
 * of what this test needs, and the adapter answers it through the same seam the screen uses. */
const withCredits: Party = {
  id: 'party-6',
  name: 'Balaji Distributors',
  mobile: '',
  gstin: '',
  city: 'Hyderabad',
  outstandingPaise: 0,
  trustGrade: 'A',
  creditLimitPaise: 0,
  creditDays: 30,
  overduePaise: 0, paysAtCounter: false,
  gstinStatus: 'active',
}

beforeEach(async () => {
  host = document.createElement('div')
  document.body.append(host)
  useInvoice.getState().reset()
  useInvoice.getState().chooseParty(withCredits)
  useInvoice.getState().load([{ ...emptyRow('row-0'), itemId: 'item-0', itemName: 'Bolt', quantity: 1, pricePaise: 20_000_00, amountPaise: 20_000_00 }])
  mounted(host, <Breakdown />)
  await settled()
})

afterEach(() => {
  unmountAll()
  host.remove()
  useInvoice.getState().reset()
})

/** Opens the panel and waits for the credit list to ARRIVE, not for a length of time. The mock
 * adapter is deliberately slow — a couple of hundred milliseconds, so that a loading state has to
 * exist — and a test that measures before the answer lands measures an empty panel. */
const open = async (expectCredits = true) => {
  // NAMED, NOT MATCHED BY SHAPE. This looked for "a button with aria-expanded and no label",
  // which was unique until the Split door landed beside Settle wearing exactly that. A selector
  // that describes a button rather than naming it goes wrong the day a second one matches.
  const settle = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (one) => one.textContent?.trim() === 'Settle',
  )!
  settle.click()
  await settled(() => document.querySelector('[aria-label="Settle this invoice"]') !== null)
  if (expectCredits) await settled(() => panel().querySelectorAll('li').length > 0)
}

const panel = () => document.querySelector<HTMLElement>('[aria-label="Settle this invoice"]')!

const figureUnder = (label: string) => {
  const row = [...panel().querySelectorAll('div')].find(
    (box) => box.children.length === 2 && box.firstElementChild?.textContent?.trim() === label,
  )
  return row?.lastElementChild?.textContent?.trim() ?? null
}

it('opens on Settle and says what is owed in the two ruled words', async () => {
  await open()
  // NEVER "party payable" — that is a ledger phrase meaning what the party owes across every
  // bill, not this one, and it is what made three people read the figure three different ways.
  expect(panel().textContent).toContain('Invoice total')
  expect(panel().textContent).toContain('Balance receivable')
  expect(panel().textContent).not.toContain('payable')
})

it('shows all four credit types, with a dash where on account has no reference', async () => {
  await open()
  for (const type of ['Advance', 'Receipt', 'Credit Note', 'On Account']) {
    expect(panel().textContent).toContain(type)
  }
  const onAccount = [...panel().querySelectorAll('li')].find((row) => row.textContent?.includes('On Account'))!
  expect(onAccount.textContent).toContain('—')
})

it('ticking a credit moves the balance by what it is worth, and no further', async () => {
  await open()
  const before = figureUnder('Balance receivable')
  const tick = panel().querySelector<HTMLInputElement>('input[aria-label="Use this Receipt"]')!
  tick.click()
  await settled()
  const after = figureUnder('Balance receivable')
  expect(after).not.toBe(before)
  // The seeded receipt is 12,500.00 against a 20,000.00 invoice, so what is left is 7,500.00.
  expect(after).toBe('₹7,500.00')
})

it('a credit bigger than what is left gives only what is left', async () => {
  await open()
  // Receipt is 12,500.00 and Advance is 5,000.00 against a 20,000.00 invoice, so both fit.
  // Ticking the third and fourth cannot take the balance below zero.
  for (const label of ['Use this Receipt', 'Use this Advance', 'Use this Credit Note', 'Use this On Account']) {
    panel().querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!.click()
    await settled()
  }
  expect(figureUnder('Balance receivable')).toBe('₹0.00')
  // THE BALANCE ALONE PROVES NOTHING HERE, and it was the only thing this asked at first. It is
  // clamped at zero, so it reads ₹0.00 whether the credits were held back or not — the check
  // passed with the ceiling deleted. The ADJUSTED figure is where the fault shows: the four
  // credits are worth 20,100.00 against a 20,000.00 invoice, so a panel that took all of them
  // would be adjusting a hundred rupees the customer never owed.
  expect(figureUnder('Adjusted')).toBe('20,000.00')
})

it('offers Tendered on cash and takes it away on every other mode', async () => {
  await open()
  // Cash is what the panel opens on, because the counter is where it is used.
  expect(panel().querySelector('input[inputmode="decimal"][class*="w-32"]')).not.toBeNull()
  expect(panel().textContent).toContain('Tendered')
  expect(panel().textContent).toContain('Change')

  const bank = [...panel().querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Bank')!
  bank.click()
  await settled()
  // NOT SHOWN AS ZERO. A zero in a field says "this applies and the answer is none", and nobody
  // hands back three rupees on a bank transfer.
  expect(panel().textContent).not.toContain('Tendered')
  expect(panel().textContent).not.toContain('Change')
})
