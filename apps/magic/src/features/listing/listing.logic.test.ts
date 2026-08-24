// The listing's arithmetic, tested without a browser because none of it needs one.
//
// The cases that matter are the ones a naive version gets wrong: an invoice paid months after
// it was due is paid and not overdue, a cancelled invoice is owed nothing, "last 7 days" is
// six days and today rather than seven days and today, and the tab counts are taken before the
// tab is applied so each one says how many WOULD be left.

import { describe, expect, it } from 'vitest'

import type { Invoice } from '../../data/schema/invoice'
import { cannotGenerate, grouped, narrow, needsCompliance, onTab, page, pageCount, sorted, type Narrowing } from './filtering'

const TODAY = '2026-08-20'

const invoice = (overrides: Partial<Invoice>): Invoice => ({
  id: 'invoice-x', number: 'INV/2026/0001', date: TODAY, dueDate: TODAY,
  partyId: 'party-x', partyName: 'Sharma Traders',
  taxablePaise: 84746, taxPaise: 15254, totalPaise: 100000, paidPaise: 0, cancelledAt: null,
  eInvoiceStatus: 'notRequired', eWayBillStatus: 'notRequired', rows: [],
  ...overrides,
})

const EVERYTHING: Narrowing = {
  range: { from: null, to: null }, search: '', party: null, total: null, pending: null, compliance: [],
}

// What an invoice is CALLED, and what is owed on it, are tested in lib/payment.logic.test.ts.
// They were tested here too, in a second copy of the same arithmetic that answered differently.

describe('narrowing the list', () => {
  const list = [
    invoice({ id: 'a', number: 'INV/2026/0012', partyName: 'Sharma Traders', totalPaise: 100000 }),
    invoice({ id: 'b', number: 'INV/2026/0034', partyName: 'Metro Distributors', totalPaise: 900000 }),
  ]

  it('finds a two-character invoice number, because a three-character floor would not', () => {
    expect(narrow(list, { ...EVERYTHING, search: '12' }).map((one) => one.id)).toEqual(['a'])
  })

  it('searches the party name as well as the number', () => {
    expect(narrow(list, { ...EVERYTHING, search: 'metro' }).map((one) => one.id)).toEqual(['b'])
  })

  it('reads a min on its own as everything above it', () => {
    const over = { ...EVERYTHING, total: { min: 500000, max: null } }
    expect(narrow(list, over).map((one) => one.id)).toEqual(['b'])
  })

  it('reads a max on its own as everything below it', () => {
    const under = { ...EVERYTHING, total: { min: null, max: 500000 } }
    expect(narrow(list, under).map((one) => one.id)).toEqual(['a'])
  })

  it('reads both ends as between, which an operator cannot say at all', () => {
    const between = { ...EVERYTHING, total: { min: 50000, max: 500000 } }
    expect(narrow(list, between).map((one) => one.id)).toEqual(['a'])
  })

  it('keeps everything when nothing is asked for', () => {
    expect(narrow(list, EVERYTHING)).toHaveLength(2)
  })

  it('finds nothing on a compliance filter, because the invoice carries no compliance field yet', () => {
    // This is the honest zero, not a bug. It turns into a real answer the day the header
    // grows the field, and `needsCompliance` is the only thing that changes.
    expect(narrow(list, { ...EVERYTHING, compliance: ['eInvoice'] })).toHaveLength(0)
  })
})

describe('the tabs', () => {
  const list = [
    invoice({ id: 'due', dueDate: '2026-03-13' }),
    invoice({ id: 'part', paidPaise: 40000 }),
    invoice({ id: 'waiting' }),
    invoice({ id: 'dead', cancelledAt: '2026-07-29' }),
  ]

  it('leaves everything under All, including the ones with no tab of their own', () => {
    expect(onTab(list, 'all', TODAY)).toHaveLength(4)
  })

  it('counts a tab as how many would be left if you pressed it', () => {
    expect(onTab(list, 'overdue', TODAY).map((one) => one.id)).toEqual(['due'])
    expect(onTab(list, 'onAccount', TODAY).map((one) => one.id)).toEqual(['part'])
  })
})

describe('grouping', () => {
  const list = [
    invoice({ id: 'a', partyName: 'Zenith' }),
    invoice({ id: 'b', partyName: 'Apex' }),
    invoice({ id: 'c', partyName: 'Zenith' }),
  ]

  it('puts rows of the same group together without reordering the groups themselves', () => {
    // Zenith came first, so Zenith stays first. Grouping is not a second sort: the sort the
    // person chose still decides which group is on top and which row is on top inside it.
    expect(grouped(list, 'party').map((one) => one.id)).toEqual(['a', 'c', 'b'])
  })

  it('leaves the list exactly as it was when nothing is grouped', () => {
    expect(grouped(list, 'none').map((one) => one.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('sorting and paging', () => {
  const list = [
    invoice({ id: 'a', partyName: 'Zenith', totalPaise: 100 }),
    invoice({ id: 'b', partyName: 'Apex', totalPaise: 900 }),
  ]

  it('sorts words as words and money as money', () => {
    expect(sorted(list, { by: 'party', direction: 'asc' }, TODAY).map((one) => one.id)).toEqual(['b', 'a'])
    expect(sorted(list, { by: 'total', direction: 'desc' }, TODAY).map((one) => one.id)).toEqual(['b', 'a'])
  })

  it('sorts names by the alphabet rather than by the numbers UTF-16 gave the letters', () => {
    // Capitals come before small letters in code-unit order, so a plain `>` puts every
    // capitalised name above every lowercase one whatever the letters say.
    const cased = [invoice({ id: 'zed', partyName: 'Zenith' }), invoice({ id: 'apex', partyName: 'apex' })]
    expect(sorted(cased, { by: 'party', direction: 'asc' }, TODAY).map((one) => one.id))
      .toEqual(['apex', 'zed'])

    // And inside Devanagari a code-unit sort is simply not the Hindi alphabet. क़ (Kabir) can
    // be written as one character or as क plus a dot below; the one-character form is numbered
    // far above ख (Khanna), so a plain `>` files Kabir after Khanna, which is backwards.
    const hindi = [
      invoice({ id: 'khanna', partyName: 'खन्ना ट्रेडर्स' }),
      invoice({ id: 'kabir', partyName: 'क़बीर एंड कंपनी' }),
    ]
    expect(sorted(hindi, { by: 'party', direction: 'asc' }, TODAY).map((one) => one.id))
      .toEqual(['kabir', 'khanna'])
  })

  it('reads a run of digits in an invoice number as a number', () => {
    const numbered = [
      invoice({ id: 'ten', number: 'INV/2026/10' }),
      invoice({ id: 'two', number: 'INV/2026/2' }),
    ]
    expect(sorted(numbered, { by: 'number', direction: 'asc' }, TODAY).map((one) => one.id))
      .toEqual(['two', 'ten'])
  })

  it('sorts status by how much it wants attention, not alphabetically', () => {
    const mixed = [invoice({ id: 'paid', paidPaise: 100000 }), invoice({ id: 'late', dueDate: '2026-01-01' })]
    expect(sorted(mixed, { by: 'status', direction: 'asc' }, TODAY).map((one) => one.id)).toEqual(['late', 'paid'])
  })

  it('never reports fewer than one page, even with nothing on it', () => {
    expect(pageCount(0, 25)).toBe(1)
    expect(page([], 1, 25)).toEqual([])
  })

  it('cuts a page at its size', () => {
    expect(page([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4])
  })
})


describe('what is waiting on the GST portal', () => {
  it('counts pending and nothing else as waiting', () => {
    // notRequired is most invoices and is an ANSWER, not an absence. expired is a bill that
    // was raised and has run out, which is a different problem needing a different action.
    expect(needsCompliance(invoice({ eInvoiceStatus: 'pending' }), 'eInvoice')).toBe(true)
    expect(needsCompliance(invoice({ eInvoiceStatus: 'notRequired' }), 'eInvoice')).toBe(false)
    expect(needsCompliance(invoice({ eWayBillStatus: 'expired' }), 'eWayBill')).toBe(false)
  })

  it('says nothing when there is nothing to say, so a live action stays live', () => {
    // The bug this replaces was the opposite: a reason that was always there, always the same
    // sentence, and no longer true — so a working feature stayed switched off with a lie on it.
    expect(cannotGenerate(invoice({ eInvoiceStatus: 'pending' }), 'eInvoice')).toBeNull()
  })

  it('gives a different reason for each way it cannot be done', () => {
    expect(cannotGenerate(invoice({ eInvoiceStatus: 'notRequired' }), 'eInvoice')).toContain('not required')
    expect(cannotGenerate(invoice({ eInvoiceStatus: 'generated' }), 'eInvoice')).toContain('already been generated')
    expect(cannotGenerate(invoice({ eWayBillStatus: 'expired' }), 'eWayBill')).toContain('expired')
  })

  it('lets cancelled beat every other reason, because it is the one that stops everything', () => {
    const dead = invoice({ cancelledAt: '2026-07-29', eInvoiceStatus: 'pending' })
    expect(cannotGenerate(dead, 'eInvoice')).toBe('This invoice is cancelled')
  })
})


// Dragging a column into a new place is tested beside the arithmetic, in packages/ui — the
// order is the column engine's now, and both tables use it.
