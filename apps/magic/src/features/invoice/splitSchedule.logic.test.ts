import { describe, expect, it } from 'vitest'

import { partsWanted, scheduled, shortfall, spread } from './splitSchedule'

const plan = { parts: 3, startDate: '2026-08-25', gapDays: 30 }

describe('spreading a total across parts', () => {
  it('divides evenly when it divides evenly', () => {
    const parts = spread(30_000_00, plan)
    expect(parts.map((part) => part.amountPaise)).toEqual([10_000_00, 10_000_00, 10_000_00])
  })

  it('puts the odd paisa on the FIRST part', () => {
    // 1000.01 across three is 333.33, 333.34, 333.34 — or 333.35 first, which is the ruling. The
    // earliest instalment is the one being paid now, so a paisa more on it is settled and
    // forgotten; on the last it sits in the future as a figure that does not match its neighbours.
    const parts = spread(1_000_01, plan)
    expect(parts.map((part) => part.amountPaise)).toEqual([33_335, 33_333, 33_333])
    expect(scheduled(parts)).toBe(1_000_01)
  })

  it('always comes to the total, whatever the remainder', () => {
    for (const total of [1, 7, 99, 100_00, 999_999]) {
      for (const count of [1, 2, 3, 7, 24]) {
        expect(scheduled(spread(total, { ...plan, parts: count }))).toBe(total)
      }
    }
  })

  it('dates the first part on the start date and steps the rest by the gap', () => {
    const parts = spread(30_000_00, plan)
    expect(parts.map((part) => part.due)).toEqual(['2026-08-25', '2026-09-24', '2026-10-24'])
  })

  it('has no cap on the number of parts, and a floor of one', () => {
    expect(spread(100_00, { ...plan, parts: 60 })).toHaveLength(60)
    expect(partsWanted(0)).toBe(1)
    expect(partsWanted(-4)).toBe(1)
    expect(partsWanted(2.7)).toBe(2)
  })
})

describe('what the drawer refuses', () => {
  it('reports what has not been allocated', () => {
    const parts = spread(30_000_00, plan)
    expect(shortfall(30_000_00, parts)).toBe(0)
    const short = parts.map((part, at) => (at === 0 ? { ...part, amountPaise: 0 } : part))
    expect(shortfall(30_000_00, short)).toBe(10_000_00)
  })

  it('reports an over-allocation as a negative, rather than pretending it is fine', () => {
    const parts = spread(30_000_00, plan)
    const over = parts.map((part, at) => (at === 0 ? { ...part, amountPaise: part.amountPaise * 2 } : part))
    expect(shortfall(30_000_00, over)).toBe(-10_000_00)
  })
})
