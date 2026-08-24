import { describe, expect, it } from 'vitest'

import { profitOf, type SoldLine } from './profit'

const sold = (over: Partial<SoldLine> = {}): SoldLine => ({
  itemId: 'item-1',
  amountPaise: 100000,
  costPaise: 60000,
  quantity: 1,
  taxPercent: 18,
  ...over,
})

describe('profit', () => {
  it('is the selling value less what the goods cost', () => {
    expect(profitOf([sold()], false)).toEqual({ profitPaise: 40000, percent: 40 })
  })

  it('multiplies the cost by the quantity, because cost is per unit', () => {
    expect(profitOf([sold({ quantity: 3, amountPaise: 300000 })], false).profitPaise).toBe(120000)
  })

  it('takes the tax out first when prices include it, or the margin counts the government in', () => {
    // 1,180.00 including 18% is 1,000.00 of goods. Against a 600.00 cost that is 400.00, not
    // 580.00 — and 580.00 is what makes every invoice look better than it was.
    expect(profitOf([sold({ amountPaise: 118000 })], true).profitPaise).toBe(40000)
  })

  it('leaves the tax alone on a line that carries none, whatever the mode', () => {
    const line = sold({ amountPaise: 100000, taxTreatment: 'exempt', taxPercent: 0 })
    expect(profitOf([line], true).profitPaise).toBe(40000)
  })

  it('reports a loss as a loss rather than hiding it at zero', () => {
    const line = sold({ costPaise: 130000 })
    expect(profitOf([line], false).profitPaise).toBe(-30000)
    expect(profitOf([line], false).percent).toBe(-30)
  })

  it('counts only rows that carry an item', () => {
    const blank: SoldLine = { itemId: null, amountPaise: 0, costPaise: 0, quantity: 0, taxPercent: 0 }
    expect(profitOf([sold(), blank, blank], false).profitPaise).toBe(40000)
  })

  it('has no percentage at all when nothing was sold, rather than claiming zero', () => {
    expect(profitOf([], false)).toEqual({ profitPaise: 0, percent: null })
  })
})
