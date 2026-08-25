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
    const { rows: settled, chargesPaise, taxableChargesPaise } = applySundries(GOODS, rows)
    const cgst = settled.find((each) => each.taxComponent === 'cgst')

    // 9% of 1,200.00 and not of 1,000.00. Freight billed by the supplier is taxable value.
    //
    // THIS ASSERTED NOTHING UNTIL 25-08. It called `applySundries`, threw the answer away, and
    // wrote the expected number in this comment — so the whole point of the case was a sentence
    // no runner could read, and it would have stayed green through any arithmetic at all. A check
    // that cannot fail is the shape this repository has a rule against, and it was in the file
    // whose name says "which is the whole point".
    expect(chargesPaise).toBe(20000)
    expect(taxableChargesPaise).toBe(20000)
    // 9% of 120000, not of 100000. If the base ever drops the charges this reads 9000.
    expect(cgst?.amountPaise).toBe(10800)
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

// THE BREAKDOWN AND THE TAX SUMMARY ARE ON THE SAME SCREEN AND MUST AGREE.
//
// They did not. `tax.ts` halves the TAX and lets the second component take the remainder, so its
// two halves always re-add to the band's tax. This file halved the RATE and rounded each half
// independently, which loses a paisa whenever the tax is odd. Found by the independent audit on
// 24-08, measured on an 18% band of 1005 paise: 90 + 90 here against 91 + 90 there.
//
// This is the test that only fails when the fault comes back, so it asks the question the two
// files actually answer rather than checking one of them against a number typed by hand.
describe('the tax rows and the tax summary agree', () => {
  const bands = [
    // Odd tax: 18% of 1005 is 180.9, which rounds to 181 and cannot be halved evenly.
    { percent: 18, taxablePaise: 1005, taxPaise: Math.round((1005 * 18) / 100) },
    { percent: 5, taxablePaise: 333, taxPaise: Math.round((333 * 5) / 100) },
    { percent: 12, taxablePaise: 8_745, taxPaise: Math.round((8745 * 12) / 100) },
  ]

  it('splits a band into two components that add back to exactly its tax', () => {
    for (const band of bands) {
      const rows = generateTaxRows([band], 'intra')
      const summed = rows.reduce((total, made) => total + made.amountPaise, 0)
      expect(summed).toBe(band.taxPaise)
    }
  })

  it('gives the whole band to IGST across a border', () => {
    for (const band of bands) {
      const rows = generateTaxRows([band], 'inter')
      expect(rows).toHaveLength(1)
      expect(rows[0]!.amountPaise).toBe(band.taxPaise)
    }
  })

  it('still names the components at half the rate, because that is what a return calls them', () => {
    const rows = generateTaxRows([bands[0]!], 'intra')
    expect(rows.map((made) => made.name)).toEqual(['CGST 9%', 'SGST 9%'])
  })
})
