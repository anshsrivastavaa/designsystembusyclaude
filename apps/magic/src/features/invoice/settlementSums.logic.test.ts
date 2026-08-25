import { describe, expect, it } from 'vitest'

import type { Credit } from '../../data/schema/credit'
import { adjustmentCeiling, settle, withAmount, withCredit } from './settlementSums'

const credit = (id: string, availablePaise: number): Credit => ({
  id,
  type: 'receipt',
  reference: `RCP/${id}`,
  date: '2026-08-01',
  availablePaise,
})

describe('what a credit may be adjusted by', () => {
  it('is what it has left, when the invoice is bigger than the credit', () => {
    expect(adjustmentCeiling(credit('a', 5_000_00), {}, 20_000_00)).toBe(5_000_00)
  })

  it('is what is still owed, when the credit is bigger than the invoice', () => {
    expect(adjustmentCeiling(credit('a', 50_000_00), {}, 2_000_00)).toBe(2_000_00)
  })

  it('leaves nothing for a second credit once the first has covered the invoice', () => {
    // WITHOUT THIS the panel hands back a negative balance and an adjusted total the CUSTOMER is
    // owed, which is a claim about money that comes from the ledger and not from subtraction.
    expect(adjustmentCeiling(credit('b', 9_000_00), { a: 2_000_00 }, 2_000_00)).toBe(0)
  })

  it('ignores what the credit itself is already adjusting, so it can be retyped upward', () => {
    expect(adjustmentCeiling(credit('a', 5_000_00), { a: 100_00 }, 20_000_00)).toBe(5_000_00)
  })
})

describe('ticking and typing', () => {
  it('offers everything a credit can give the moment it is ticked', () => {
    expect(withCredit({}, credit('a', 5_000_00), true, 20_000_00)).toEqual({ a: 5_000_00 })
  })

  it('takes the row away when it is unticked, rather than leaving a zero behind', () => {
    // One representation. A row at zero and an unticked row would be two ways to say the same
    // thing, and the tick and the amount could then disagree.
    expect(withCredit({ a: 5_000_00 }, credit('a', 5_000_00), false, 20_000_00)).toEqual({})
  })

  it('holds a typed amount inside both ceilings', () => {
    expect(withAmount({ a: 0 }, credit('a', 5_000_00), 9_999_00, 20_000_00)).toEqual({ a: 5_000_00 })
    expect(withAmount({ a: 0 }, credit('a', 5_000_00), -400, 20_000_00)).toEqual({ a: 0 })
  })
})

describe('what is left', () => {
  it('takes the credits and the money paid now off what is owed', () => {
    const answer = settle({
      owedPaise: 20_000_00,
      adjustments: { a: 5_000_00, b: 1_840_00 },
      payingPaise: 3_000_00,
      tenderedPaise: 0,
      mode: 'bank',
    })
    expect(answer.adjustedPaise).toBe(6_840_00)
    expect(answer.balancePaise).toBe(10_160_00)
  })

  it('never reports a balance below zero', () => {
    const answer = settle({
      owedPaise: 1_000_00,
      adjustments: {},
      payingPaise: 4_000_00,
      tenderedPaise: 0,
      mode: 'bank',
    })
    expect(answer.balancePaise).toBe(0)
  })

  it('gives change on cash and on nothing else', () => {
    const cash = settle({ owedPaise: 950_00, adjustments: {}, payingPaise: 950_00, tenderedPaise: 1_000_00, mode: 'cash' })
    expect(cash.changePaise).toBe(50_00)
    const bank = settle({ owedPaise: 950_00, adjustments: {}, payingPaise: 950_00, tenderedPaise: 1_000_00, mode: 'bank' })
    expect(bank.changePaise).toBe(0)
  })

  it('gives no change when less was tendered than is being paid', () => {
    const short = settle({ owedPaise: 950_00, adjustments: {}, payingPaise: 950_00, tenderedPaise: 500_00, mode: 'cash' })
    expect(short.changePaise).toBe(0)
  })
})
