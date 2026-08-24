import { describe, expect, it } from 'vitest'

import { bands, placeOfSupply, spread, taxInside, taxSummary, type TaxableLine } from './tax'

const line = (amountPaise: number, taxPercent: number): TaxableLine => ({ amountPaise, taxPercent })

describe('place of supply', () => {
  it('reads the state from the first two digits of the GSTIN', () => {
    expect(placeOfSupply('23', '23AABCU9603R1Z1', '')).toBe('intra')
    expect(placeOfSupply('23', '27AABCU9603R1Z1', '')).toBe('inter')
  })

  it('falls back to the address only when there is no GSTIN at all', () => {
    expect(placeOfSupply('23', '', '23')).toBe('intra')
    expect(placeOfSupply('23', '', '27')).toBe('inter')
    // A GSTIN present beats an address that disagrees with it.
    expect(placeOfSupply('23', '27AABCU9603R1Z1', '23')).toBe('inter')
  })
})

describe('spreading a charge across the lines', () => {
  it('splits in proportion to what each line came to', () => {
    expect(spread([line(60000, 18), line(40000, 18)], 10000)).toEqual([6000, 4000])
  })

  it('adds up to exactly the charge, with no paise created or lost', () => {
    const shares = spread([line(33333, 5), line(33333, 12), line(33334, 18)], 10001)
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10001)
  })

  it('gives the leftover paise to the largest lines, not to the smallest', () => {
    // Three equal-ish lines and 2 paise to place. The two biggest take them.
    const shares = spread([line(50000, 5), line(30000, 5), line(20000, 5)], 5)
    expect(shares.reduce((a, b) => a + b, 0)).toBe(5)
    expect(shares[0]!).toBeGreaterThanOrEqual(shares[2]!)
  })

  it('spreads a negative charge — a discount is a charge that goes the other way', () => {
    const shares = spread([line(60000, 18), line(40000, 18)], -10000)
    expect(shares.reduce((a, b) => a + b, 0)).toBe(-10000)
  })

  it('gives every line nothing when there is nothing to spread, or nothing to spread it over', () => {
    expect(spread([line(60000, 18)], 0)).toEqual([0])
    expect(spread([line(0, 18), line(0, 5)], 10000)).toEqual([0, 0])
  })
})

describe('the tax bands', () => {
  it('makes one band per rate actually used, in ascending order', () => {
    const result = bands([line(10000, 18), line(20000, 5), line(30000, 18)])
    expect(result.map((band) => band.percent)).toEqual([5, 18])
    expect(result.map((band) => band.taxablePaise)).toEqual([20000, 40000])
  })

  it('taxes each band at its own rate rather than the invoice at one rate', () => {
    const result = bands([line(100000, 5), line(100000, 18)])
    expect(result.map((band) => band.taxPaise)).toEqual([5000, 18000])
  })

  it('carries a taxable charge into every band it travelled with', () => {
    // 1,000.00 at 5% and 1,000.00 at 18%, with 200.00 of freight. Half the freight belongs to
    // each band, so 5% is charged on 1,100.00 and 18% on 1,100.00.
    const result = bands([line(100000, 5), line(100000, 18)], 20000)
    expect(result.map((band) => band.taxablePaise)).toEqual([110000, 110000])
    expect(result.map((band) => band.taxPaise)).toEqual([5500, 19800])
  })

  it('keeps a nil-rated band, with its taxable value and no tax', () => {
    const result = bands([line(50000, 0), line(50000, 18)])
    expect(result[0]).toEqual({ percent: 0, taxablePaise: 50000, taxPaise: 0 })
  })

  it('has no bands at all on an invoice with no lines', () => {
    expect(bands([])).toEqual([])
  })
})

describe('tax already inside a price', () => {
  it('takes the rate off the value before tax, not off the price', () => {
    // 118.00 including 18% holds 18.00 of tax. 100.00 * 0.18 — not 118.00 * 0.18.
    expect(taxInside(11800, 18)).toBe(1800)
    expect(taxInside(10500, 5)).toBe(500)
  })

  it('finds no tax inside a nil-rated price', () => {
    expect(taxInside(10000, 0)).toBe(0)
  })
})

describe('the tax summary', () => {
  const sold = (amountPaise: number, taxPercent: number, over: Partial<TaxableLine> = {}): TaxableLine => ({
    amountPaise,
    taxPercent,
    ...over,
  })

  it('splits the tax in half inside the state, and the halves come to the whole', () => {
    const { lines } = taxSummary([sold(100000, 18)], 0, 'intra')
    expect(lines[0]).toMatchObject({ label: '18%', taxablePaise: 100000, cgstPaise: 9000, sgstPaise: 9000, igstPaise: 0 })
  })

  it('gives the whole rate to IGST across a border', () => {
    const { lines } = taxSummary([sold(100000, 18)], 0, 'inter')
    expect(lines[0]).toMatchObject({ cgstPaise: 0, sgstPaise: 0, igstPaise: 18000 })
  })

  it('halves an odd tax without losing or inventing a paise', () => {
    // 5% of 1,000.01 is 50.00 and a half. The two components must still add to the band.
    const { lines } = taxSummary([sold(100001, 5)], 0, 'intra')
    expect(lines[0]!.cgstPaise + lines[0]!.sgstPaise).toBe(5000)
  })

  it('shows nil-rated, exempt and zero-rated on their own lines, each with no tax', () => {
    const { lines } = taxSummary(
      [
        sold(100000, 18),
        sold(20000, 0, { taxTreatment: 'nil' }),
        sold(30000, 0, { taxTreatment: 'exempt' }),
        sold(40000, 0, { taxTreatment: 'zeroRated' }),
      ],
      0,
      'intra',
    )
    expect(lines.map((each) => each.label)).toEqual(['18%', 'Nil-rated', 'Exempt', 'Zero-rated'])
    for (const untaxed of lines.slice(1)) {
      expect(untaxed.cgstPaise + untaxed.sgstPaise + untaxed.igstPaise + untaxed.cessPaise).toBe(0)
    }
    expect(lines[2]!.taxablePaise).toBe(30000)
  })

  it('leaves out a treatment nothing on this invoice carries', () => {
    const { lines } = taxSummary([sold(100000, 18)], 0, 'intra')
    expect(lines.map((each) => each.label)).toEqual(['18%'])
  })

  it('carries cess on the band whose goods have it', () => {
    const { lines } = taxSummary([sold(100000, 18, { cessPercent: 12 }), sold(100000, 5)], 0, 'intra')
    expect(lines.find((each) => each.label === '18%')!.cessPaise).toBe(12000)
    expect(lines.find((each) => each.label === '5%')!.cessPaise).toBe(0)
  })

  it('spreads a taxable charge onto the taxed bands and not onto the untaxed lines', () => {
    const { lines } = taxSummary([sold(100000, 18), sold(100000, 0, { taxTreatment: 'exempt' })], 20000, 'intra')
    // Half the freight belongs to each line by value, but only the taxed one is taxed on it.
    expect(lines.find((each) => each.label === '18%')!.taxablePaise).toBe(110000)
    expect(lines.find((each) => each.label === 'Exempt')!.taxablePaise).toBe(100000)
  })

  it('totals by adding the lines, never by taxing the invoice again', () => {
    const rows = [sold(100000, 18), sold(100000, 5), sold(50000, 0, { taxTreatment: 'nil' })]
    const { lines, total } = taxSummary(rows, 0, 'intra')
    expect(total.taxablePaise).toBe(lines.reduce((running, each) => running + each.taxablePaise, 0))
    expect(total.cgstPaise + total.sgstPaise).toBe(18000 + 5000)
    expect(total.label).toBe('Total')
  })

  it('says nothing at all about an invoice with no lines', () => {
    const { lines, total } = taxSummary([], 0, 'intra')
    expect(lines).toEqual([])
    expect(total.taxablePaise).toBe(0)
  })
})

describe('a GSTIN that arrived with whitespace', () => {
  it('reads the state from the trimmed value, not from the space in front of it', () => {
    // A paste from a spreadsheet brings the space with it. Trimming for the emptiness test and
    // then slicing the untrimmed string read " 2" as the state code, matched nothing, and
    // charged IGST on a local sale — the wrong tax to the wrong government, with nothing on the
    // screen looking odd.
    expect(placeOfSupply('23', ' 23AABCU9603R1Z1', '')).toBe('intra')
    expect(placeOfSupply('23', '23AABCU9603R1Z1 ', '')).toBe('intra')
    expect(placeOfSupply('23', '  27AABCU9603R1Z1', '')).toBe('inter')
  })

  it('trims the address too, for the same reason', () => {
    expect(placeOfSupply('23', '   ', ' 23 ')).toBe('intra')
  })
})
