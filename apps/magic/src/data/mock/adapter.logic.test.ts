import { describe, it, expect } from 'vitest'

import { itemSchema } from '../schema/item'
import { invoiceSchema } from '../schema/invoice'
import { mockAdapter } from './adapter'
import { lineAmount } from '../../lib/money'
import { invoiceOf } from './lines'
import { invoices } from './invoices'
import type { Refusal } from '../schema/refusal'
import { isRefusal } from '../schema/refusal'

/** Every call can be told no, so a test has to say which one it expected. */
function accepted<Value>(answer: Value | Refusal): Value {
  if (isRefusal(answer)) throw new Error(`expected an answer, got a refusal: ${answer.message}`)
  return answer
}
import { items } from './items'

describe('the mock world', () => {
  it('cannot describe an impossible item', () => {
    for (const item of items) expect(() => itemSchema.parse(item)).not.toThrow()
  })

  it('cannot describe an impossible invoice', () => {
    for (const invoice of invoices) expect(() => invoiceSchema.parse(invoice)).not.toThrow()
  })

  it('carries the awkward invoices, because they are what break a screen', () => {
    expect(invoices.some((invoice) => invoice.paidPaise === 0)).toBe(true)
    expect(invoices.some((invoice) => invoice.paidPaise > 0 && invoice.paidPaise < invoice.totalPaise)).toBe(true)
    expect(invoices.some((invoice) => invoice.cancelledAt !== null)).toBe(true)
    expect(invoices.some((invoice) => invoice.dueDate < '2026-06-01')).toBe(true)
    expect(invoices.some((invoice) => invoice.rows.length >= 1800)).toBe(true)
    // A party with no GSTIN, which every screen that prints one meets.
    const cash = invoices.find((invoice) => invoice.partyName === 'Cash')
    expect(cash).toBeDefined()
  })

  it('builds an invoice of exactly the size asked for', () => {
    expect(invoiceOf(2000).rows).toHaveLength(2000)
  })

  it('finds an item by its name', async () => {
    const found = accepted(await mockAdapter.listItems('Copper'))
    expect(found.length).toBeGreaterThan(0)
    expect(found.every((item) => item.name.includes('Copper'))).toBe(true)
  })

  it('finds an item by its alias and by its barcode', async () => {
    const [first] = items
    const byAlias = accepted(await mockAdapter.listItems(first!.alias))
    const byBarcode = accepted(await mockAdapter.listItems(first!.barcode))
    expect(byAlias.map((item) => item.id)).toContain(first!.id)
    expect(byBarcode.map((item) => item.id)).toContain(first!.id)
  })

  it('holds some items that are sold loose, with no unit at all', () => {
    expect(items.some((item) => item.units.length === 0)).toBe(true)
  })
})

describe('the seeded year', () => {
  const inTheYear = (invoice: (typeof invoices)[number]) =>
    invoice.date >= '2026-04-01' && invoice.date <= '2027-03-31'

  it('has enough invoices for a listing to behave like a listing', () => {
    // Seven is not a listing. With seven rows there is no pager, no scrolling, and no way to
    // judge density — every decision about the screen made against a page that never occurs.
    expect(invoices.filter(inTheYear).length).toBeGreaterThanOrEqual(60)
  })

  it('keeps the awkward seven exactly as they were', () => {
    const seven = invoices.slice(0, 7)
    expect(seven.map((invoice) => invoice.id)).toEqual([
      'invoice-1', 'invoice-2', 'invoice-3', 'invoice-4', 'invoice-5', 'invoice-6', 'invoice-7',
    ])
    // The cases, named, so adding more sample data can never quietly file them down.
    expect(seven[0]!.partyName).toBe('Cash')
    expect(seven[1]!.paidPaise).toBe(0)
    expect(seven[2]!.paidPaise).toBeGreaterThan(0)
    expect(seven[2]!.paidPaise).toBeLessThan(seven[2]!.totalPaise)
    expect(seven[3]!.cancelledAt).not.toBeNull()
    expect(seven[4]!.dueDate < '2026-08-20').toBe(true)
    expect(seven[5]!.paidPaise).toBe(seven[5]!.totalPaise)
    expect(seven[6]!.rows).toHaveLength(1800)
  })

  it('leaves some invoices waiting on the portal, so the compliance filters find something', () => {
    expect(invoices.filter((invoice) => invoice.eInvoiceStatus === 'pending').length).toBeGreaterThan(0)
    expect(invoices.filter((invoice) => invoice.eWayBillStatus === 'pending').length).toBeGreaterThan(0)
    // And most need neither, which is the ordinary answer rather than an absence.
    expect(invoices.filter((invoice) => invoice.eInvoiceStatus === 'notRequired').length).toBeGreaterThan(20)
  })

  // THE MOCK IS THE SPECIFICATION THE BACKEND TEAM READS, and docs/architecture.md tells them
  // it "cannot describe an impossible invoice". On 24-08 an independent audit found that every
  // seeded header contradicted its own rows: `totalPaise` was hand-set beside a body nobody had
  // added up, and sixty-six of the sixty-seven shared one six-line body, so all of them reported
  // the same taxable value of 3,686.90 against Invoice Amounts from 450 to 42,450. The
  // eighteen-hundred-row one was out by a factor of ten. This is the sentence made checkable.
  it('cannot describe an impossible invoice: every header is what its own rows come to', () => {
    for (const invoice of invoices) {
      const taxable = invoice.rows.reduce((sum, row) => sum + row.amountPaise, 0)
      const tax = invoice.rows.reduce((sum, row) => sum + Math.round((row.amountPaise * row.taxPercent) / 100), 0)
      expect({ id: invoice.id, taxablePaise: invoice.taxablePaise }).toEqual({ id: invoice.id, taxablePaise: taxable })
      expect({ id: invoice.id, taxPaise: invoice.taxPaise }).toEqual({ id: invoice.id, taxPaise: tax })
      expect({ id: invoice.id, totalPaise: invoice.totalPaise }).toEqual({ id: invoice.id, totalPaise: taxable + tax })
      // Nobody has paid more than the invoice is worth.
      expect(invoice.paidPaise).toBeLessThanOrEqual(invoice.totalPaise)
    }
  })

  // And the rows have to be possible too, one line at a time. A discount shown in the Disc%
  // column and not taken off the amount is the same class of fault one level down, and it was
  // there until 24-08 as well.
  it('every line amount is its own quantity, price and discount', () => {
    for (const invoice of invoices) {
      for (const row of invoice.rows) {
        expect({ id: invoice.id, row: row.id, amountPaise: row.amountPaise }).toEqual({
          id: invoice.id,
          row: row.id,
          amountPaise: lineAmount(row.quantity, row.pricePaise, row.discountPercent),
        })
      }
    }
  })

  // ONE SHAPE, AND IT IS THE SHAPE THE OFFERED NUMBER WEARS. `nextInvoiceNumber` offered
  // `68/2026-27` while the seeded book and `saveInvoice` both wrote `INV/2026/0068`, so the
  // number a person had been looking at changed shape at the moment they saved.
  it('every invoice number in the book has the shape the header offers', async () => {
    const offered = await mockAdapter.nextInvoiceNumber('Main')
    const shape = /^\d+\/\d{4}-\d{2}$/
    expect(offered).toMatch(shape)
    for (const invoice of invoices) expect(invoice.number).toMatch(shape)
  })

  // A STATE THE DATA CANNOT REACH IS A STATE NOBODY HAS LOOKED AT. Five of these existed only
  // in the type: an e-way bill expired or cancelled, an e-invoice cancelled, a line with goods
  // given free, and a pickable charge that is not part of the taxable value. Every screen that
  // words or colours them had been judged against 'generated' and 'pending' and nothing else.
  // Found by the independent audit on 24-08. `Refusal.field` was the sixth and is covered by
  // its own journey, because it is a behaviour rather than a row of data.
  it('carries every state the schemas argue for, so none of them is drawn for the first time in front of a stakeholder', () => {
    const has = (predicate: (invoice: (typeof invoices)[number]) => boolean) => invoices.some(predicate)
    expect(has((invoice) => invoice.eWayBillStatus === 'expired')).toBe(true)
    expect(has((invoice) => invoice.eWayBillStatus === 'cancelled')).toBe(true)
    expect(has((invoice) => invoice.eInvoiceStatus === 'cancelled')).toBe(true)
    expect(has((invoice) => invoice.rows.some((row) => row.freeQuantity > 0))).toBe(true)
  })

  it('offers at least one charge that is not part of the taxable value', async () => {
    const offered = await mockAdapter.listSundries('')
    expect(Array.isArray(offered)).toBe(true)
    const charges = offered as Exclude<typeof offered, { message: string }>
    // Not the tax components — those are generated rather than picked and never reach the list,
    // which is exactly why `taxable: false` had never been seen on a charge anybody can choose.
    expect(charges.every((charge) => charge.taxComponent === null)).toBe(true)
    expect(charges.some((charge) => charge.taxable === false)).toBe(true)
  })
})
