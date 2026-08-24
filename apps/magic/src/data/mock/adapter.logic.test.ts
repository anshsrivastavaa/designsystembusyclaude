import { describe, it, expect } from 'vitest'

import { itemSchema } from '../schema/item'
import { invoiceSchema } from '../schema/invoice'
import { mockAdapter } from './adapter'
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
})
