import { describe, expect, it } from 'vitest'

import type { InvoiceSettings } from '../data/schema/settings'
import type { SundryRow } from '../data/schema/sundry'
import { invoiceBreakdown, type InvoiceLine } from './totals'

const SETTINGS: InvoiceSettings = {
  taxMode: 'itemExclusive',
  roundOff: { stepPaise: 100, method: 'nearest', on: false },
  columns: { discount: false, alias: false, hsn: false, mrp: false, freeQuantity: false },
  roundEachLine: false,
  hsnWiseSummary: false,
  companyStateCode: '23',
}

const line = (amountPaise: number, taxPercent: number, quantity = 1): InvoiceLine => ({
  itemId: 'item-1',
  quantity,
  amountPaise,
  taxPercent,
})

const freight = (value: number): SundryRow => ({
  id: 'freight',
  sundryId: 'sundry-freight',
  name: 'Freight',
  kind: 'flat',
  value,
  amountPaise: 0,
  taxable: true,
  taxComponent: null,
})

const breakdown = (over: Partial<Parameters<typeof invoiceBreakdown>[0]> = {}) =>
  invoiceBreakdown({ rows: [], sundries: [], settings: SETTINGS, place: 'intra', ...over })

describe('the breakdown', () => {
  it('counts filled lines and never rows on screen', () => {
    const empty: InvoiceLine = { itemId: null, quantity: 0, amountPaise: 0, taxPercent: 0 }
    expect(breakdown({ rows: [line(10000, 18), empty, empty] }).lines).toBe(1)
  })

  it('adds the charges to the sub-total and taxes them at the rate of the goods they carried', () => {
    const result = breakdown({ rows: [line(100000, 18)], sundries: [freight(20000)] })
    expect(result.subtotalPaise).toBe(100000)
    expect(result.chargesPaise).toBe(20000)
    // 18% of 1,200.00, not of 1,000.00 — freight billed by the supplier is taxable value.
    expect(result.taxPaise).toBe(21600)
    expect(result.grandTotalPaise).toBe(141600)
  })

  it('leaves tax inside the sub-total in inclusive mode and says so, rather than adding it again', () => {
    const settings: InvoiceSettings = { ...SETTINGS, taxMode: 'itemInclusive' }
    const result = breakdown({ rows: [line(11800, 18)], settings })
    expect(result.taxIsInside).toBe(true)
    expect(result.taxPaise).toBe(1800)
    // The total is the sub-total. The tax figure is reachable, and it is not an addend.
    expect(result.grandTotalPaise).toBe(11800)
  })

  it('adds tax on top in exclusive mode', () => {
    const result = breakdown({ rows: [line(10000, 18)] })
    expect(result.taxIsInside).toBe(false)
    expect(result.grandTotalPaise).toBe(11800)
  })

  it('generates a tax row per component per band in bill-wise mode', () => {
    const settings: InvoiceSettings = { ...SETTINGS, taxMode: 'billWise' }
    const result = breakdown({ rows: [line(100000, 5), line(100000, 18)], settings })
    expect(result.sundryRows.map((row) => row.name)).toEqual(['CGST 2.5%', 'SGST 2.5%', 'CGST 9%', 'SGST 9%'])
    expect(result.taxPaise).toBe(23000)
  })

  it('generates one row per band across a border instead of a pair', () => {
    const settings: InvoiceSettings = { ...SETTINGS, taxMode: 'billWise' }
    const result = breakdown({ rows: [line(100000, 18)], settings, place: 'inter' })
    expect(result.sundryRows.map((row) => row.name)).toEqual(['IGST 18%'])
    expect(result.taxPaise).toBe(18000)
  })

  it('rounds the payable only when the round off line is switched on', () => {
    const rows = [line(100049, 0)]
    expect(breakdown({ rows }).roundOffPaise).toBe(0)
    const on: InvoiceSettings = { ...SETTINGS, roundOff: { ...SETTINGS.roundOff, on: true } }
    const rounded = breakdown({ rows, settings: on })
    expect(rounded.roundOffPaise).toBe(-49)
    expect(rounded.grandTotalPaise).toBe(100000)
  })

  it("puts the freight's tax in the TOTAL and never on a row", () => {
    // A per-row tax column is the tax on the goods in that row. A row quietly carrying a share
    // of the freight's tax is a number nobody can reconcile against the line it sits on — so
    // the spreading happens on a copy, and the rows themselves come back untouched.
    const rows = [line(100000, 5), line(100000, 18)]
    const before = rows.map((row) => ({ ...row }))
    const result = breakdown({ rows, sundries: [freight(20000)] })

    expect(rows).toEqual(before)

    const perRowTax = rows.reduce((running, row) => running + Math.round((row.amountPaise * row.taxPercent) / 100), 0)
    expect(perRowTax).toBe(23000)
    // The difference is the tax on the freight, and it lives only in the total.
    expect(result.taxPaise).toBe(25300)
  })

  it('reports one band per rate, for the strip to count and the summary to list', () => {
    const result = breakdown({ rows: [line(10000, 5), line(10000, 12), line(10000, 18)] })
    expect(result.bands.map((band) => band.percent)).toEqual([5, 12, 18])
  })

  it('says nothing at all about an invoice with nothing on it', () => {
    const result = breakdown()
    expect(result).toMatchObject({ lines: 0, subtotalPaise: 0, chargesPaise: 0, taxPaise: 0, grandTotalPaise: 0 })
    expect(result.bands).toEqual([])
  })
})

describe('rounding each line before adding', () => {
  const rows = [line(10050, 0), line(10050, 0), line(10050, 0)]

  it('is off by default, and the total keeps every paise', () => {
    expect(breakdown({ rows }).subtotalPaise).toBe(30150)
  })

  it('adds the ALREADY-ROUNDED lines when it is on, rather than rounding the total', () => {
    const settings: InvoiceSettings = { ...SETTINGS, roundEachLine: true }
    // Each 100.50 becomes 101.00, so three of them are 303.00 — not 301.50 rounded to 302.00,
    // which is what recomputing from the unrounded values would give.
    expect(breakdown({ rows, settings }).subtotalPaise).toBe(30300)
  })

  it('taxes what the rounded lines come to, not what they were before', () => {
    const settings: InvoiceSettings = { ...SETTINGS, roundEachLine: true }
    const taxed = [line(10050, 18)]
    expect(breakdown({ rows: taxed, settings }).taxPaise).toBe(Math.round(10100 * 0.18))
  })
})
