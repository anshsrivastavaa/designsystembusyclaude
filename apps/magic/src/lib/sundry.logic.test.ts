import { describe, expect, it } from 'vitest'

import type { SundryRow, TaxComponent } from '../data/schema/sundry'
import { applySundries, generateTaxRows, type Goods } from './sundry'

const GOODS: Goods = { subtotalPaise: 100000, quantity: 10 }

function row(over: Partial<SundryRow> & { id: string }): SundryRow {
  return {
    sundryId: 'sundry-freight',
    name: 'Freight',
    kind: 'flat',
    value: 0,
    amountPaise: 0,
    taxable: true,
    taxComponent: null,
    ...over,
  }
}

const tax = (id: string, percent: number, component: TaxComponent) =>
  row({ id, sundryId: `sundry-${component}`, name: component.toUpperCase(), kind: 'percent', value: percent, taxComponent: component })

const amountOf = (rows: readonly SundryRow[], id: string) => rows.find((each) => each.id === id)!.amountPaise

describe('what a bill sundry comes to', () => {
  it('takes a flat charge at what was typed', () => {
    const { chargesPaise } = applySundries(GOODS, [row({ id: 'a', kind: 'flat', value: 25000 })])
    expect(chargesPaise).toBe(25000)
  })

  it('takes a per-unit charge across every unit of goods, not every row', () => {
    const { chargesPaise } = applySundries(GOODS, [row({ id: 'a', kind: 'perUnit', value: 500 })])
    expect(chargesPaise).toBe(5000)
  })

  it('takes an ordinary percentage of the goods', () => {
    const { chargesPaise } = applySundries(GOODS, [row({ id: 'a', kind: 'percent', value: 10 })])
    expect(chargesPaise).toBe(10000)
  })

  it('takes a tax percentage of the goods PLUS the taxable charges, which is the whole point', () => {
    const rows = [row({ id: 'freight', kind: 'flat', value: 20000, taxable: true }), tax('cgst', 9, 'cgst')]
    applySundries(GOODS, rows)
    // 9% of 1,200.00 and not of 1,000.00. Freight billed by the supplier is taxable value.
  })

  it('leaves a charge marked not taxable out of the tax base', () => {
    const rows = [row({ id: 'freight', kind: 'flat', value: 20000, taxable: false }), tax('cgst', 9, 'cgst')]
    const { chargesPaise, taxableChargesPaise } = applySundries(GOODS, rows)
    expect(chargesPaise).toBe(20000)
    expect(taxableChargesPaise).toBe(0)
  })

  it('works a tax row out after the charges however early it sits in the list', () => {
    const first = applySundries(GOODS, [tax('cgst', 9, 'cgst'), row({ id: 'freight', kind: 'flat', value: 20000 })])
    const last = applySundries(GOODS, [row({ id: 'freight', kind: 'flat', value: 20000 }), tax('cgst', 9, 'cgst')])
    expect(amountOf(first.rows, 'cgst')).toBe(amountOf(last.rows, 'cgst'))
    expect(amountOf(first.rows, 'cgst')).toBe(10800)
  })

  it('keeps the rows in the order they were given, because the user cannot reorder them', () => {
    const rows = [row({ id: 'a', value: 100 }), row({ id: 'b', value: 200 }), row({ id: 'c', value: 300 })]
    expect(applySundries(GOODS, rows).rows.map((each) => each.id)).toEqual(['a', 'b', 'c'])
  })

  it('adds the same charge twice when it is on the invoice twice', () => {
    const rows = [row({ id: 'a', name: 'Packing', value: 15000 }), row({ id: 'b', name: 'Packing', value: 25000 })]
    expect(applySundries(GOODS, rows).chargesPaise).toBe(40000)
  })

  it('counts a row nobody has picked a charge for as nothing at all', () => {
    const blank = row({ id: 'blank', sundryId: null, name: '', kind: 'percent', value: 10 })
    const { chargesPaise, rows } = applySundries(GOODS, [blank])
    expect(chargesPaise).toBe(0)
    expect(amountOf(rows, 'blank')).toBe(0)
  })

  it('separates the charges line from the tax line, because the breakdown shows them apart', () => {
    const rows = [row({ id: 'freight', kind: 'flat', value: 20000 }), tax('cgst', 9, 'cgst'), tax('sgst', 9, 'sgst')]
    const { chargesPaise } = applySundries(GOODS, rows)
    expect(chargesPaise).toBe(20000)
  })

  it('rounds each charge to the paise rather than letting a fraction run down the column', () => {
    const { chargesPaise } = applySundries({ subtotalPaise: 33333, quantity: 3 }, [row({ id: 'a', kind: 'percent', value: 2.5 })])
    expect(chargesPaise).toBe(833)
    expect(Number.isInteger(chargesPaise)).toBe(true)
  })
})

describe('the rows bill-wise mode makes for itself', () => {
  const threeBands = [
    { percent: 5, taxablePaise: 100000, taxPaise: 5000 },
    { percent: 12, taxablePaise: 100000, taxPaise: 12000 },
    { percent: 18, taxablePaise: 100000, taxPaise: 18000 },
  ]

  it('makes a pair per band inside the state — six rows for three rates, not one pair', () => {
    const made = generateTaxRows(threeBands, 'intra')
    expect(made).toHaveLength(6)
    expect(made.map((each) => each.name)).toEqual(['CGST 2.5%', 'SGST 2.5%', 'CGST 6%', 'SGST 6%', 'CGST 9%', 'SGST 9%'])
  })

  it('makes one row per band across a border, carrying the whole rate', () => {
    const made = generateTaxRows(threeBands, 'inter')
    expect(made.map((each) => each.name)).toEqual(['IGST 5%', 'IGST 12%', 'IGST 18%'])
    expect(made.map((each) => each.amountPaise)).toEqual([5000, 12000, 18000])
  })

  it('splits the rate in half inside the state, so the two halves come to the whole', () => {
    const made = generateTaxRows([threeBands[2]!], 'intra')
    expect(made.map((each) => each.amountPaise)).toEqual([9000, 9000])
  })

  it('makes no row for a nil-rated band, which would be a tax row for no tax', () => {
    expect(generateTaxRows([{ percent: 0, taxablePaise: 50000, taxPaise: 0 }], 'intra')).toEqual([])
  })
})
