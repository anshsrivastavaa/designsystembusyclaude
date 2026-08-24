// The eight date periods, and the day they all start from.
//
// These were in listing.logic.test.ts along with statuses, narrowing, sorting and the store,
// which is four things in one file and was two lines under the size cap. Dates are their own
// subject and they are the subject with the most ways to be quietly wrong: a financial year
// that starts in April, a month that does not always end on the 30th, and a "today" that is
// yesterday for five and a half hours every night.

import { describe, expect, it } from 'vitest'

import { rangeDates, rangeFor, withinRange } from './dateRanges'

const TODAY = '2026-08-20'

describe('the date periods', () => {
  it('counts today as one of the last 7 days, rather than reaching back an eighth', () => {
    expect(rangeFor('last7', TODAY)).toEqual({ from: '2026-08-14', to: TODAY })
  })

  it('runs the financial year April to March', () => {
    expect(rangeFor('currentFy', TODAY)).toEqual({ from: '2026-04-01', to: '2027-03-31' })
  })

  it('puts a day in January in the financial year that started the previous April', () => {
    expect(rangeFor('currentFy', '2027-01-15')).toEqual({ from: '2026-04-01', to: '2027-03-31' })
  })

  it('ends a month on its own last day rather than on the 30th of every month', () => {
    expect(rangeFor('thisMonth', '2026-02-10').to).toBe('2026-02-28')
    expect(rangeFor('thisMonth', '2026-08-10').to).toBe('2026-08-31')
  })

  it('prints the dates a period actually covers, so the name never has to be trusted', () => {
    expect(rangeDates('currentFy', TODAY)).toBe('01-04-2026 – 31-03-2027')
    expect(rangeDates('today', TODAY)).toBe('20-08-2026')
  })

  it('lets an open-ended period hold everything', () => {
    expect(withinRange('1999-01-01', { from: null, to: null })).toBe(true)
  })
})
