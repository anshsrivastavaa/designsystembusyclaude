import { afterEach, describe, expect, it, vi } from 'vitest'

import { dayFromText, dayText, daysAfter, monthGrid, monthShifted, monthStart, monthTitle, today } from './day'

// WHICH DAY THE WHOLE PRODUCT THINKS IT IS. Every status, every period and every insight on
// the listing is worked out from this one string, and now so is the date a new invoice opens
// on — so it is the single value that can put two screens on the wrong day at once.
//
// These moved here with the function, from the listing's own tests. A test that travels with
// what it tests is the whole reason this stopped being two functions.
describe('what day it is', () => {
  const inIndia = (moment: string) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(moment))
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  // Everything below is a statement about a machine standing in India, and the logic tier is
  // set to Asia/Kolkata in vitest.config.ts to make that true wherever it runs. If that ever
  // goes, this fails first and says so, rather than the other three quietly becoming
  // statements about Greenwich.
  it('runs on Indian time, five and a half hours ahead', () => {
    expect(new Date('2026-08-20T19:00:00Z').getTimezoneOffset()).toBe(-330)
  })

  it('is the local day at half past midnight, when UTC is still on yesterday', () => {
    // 00:30 on the 21st in India is 19:00 on the 20th in Greenwich. Somebody opening the books
    // early is entitled to see the 21st.
    inIndia('2026-08-20T19:00:00Z')
    expect(today()).toBe('2026-08-21')
  })

  it('is still the local day at half past five, the last minute UTC disagrees', () => {
    inIndia('2026-08-20T23:59:00Z')
    expect(today()).toBe('2026-08-21')
  })

  it('agrees with UTC for the rest of the day', () => {
    inIndia('2026-08-21T09:00:00Z')
    expect(today()).toBe('2026-08-21')
  })

  it('pads a single-figure month and day, so the string is always sortable', () => {
    inIndia('2026-01-04T09:00:00Z')
    expect(today()).toBe('2026-01-04')
  })
})

describe('writing a day down', () => {
  it('puts the date first, the way it is written here', () => {
    expect(dayText('2026-08-21')).toBe('21-08-2026')
  })

  it('says nothing rather than something wrong when there is no day', () => {
    expect(dayText('')).toBe('')
  })
})

describe('reading a day somebody typed', () => {
  it('takes whichever separator was under their finger', () => {
    expect(dayFromText('21-08-2026')).toBe('2026-08-21')
    expect(dayFromText('21/08/2026')).toBe('2026-08-21')
    expect(dayFromText('21.08.2026')).toBe('2026-08-21')
  })

  it('pads a single digit', () => {
    expect(dayFromText('1-8-2026')).toBe('2026-08-01')
  })

  it('refuses a day that does not exist rather than moving it', () => {
    // The browser turns 31-02 into the 3rd of March without a word. An invoice dated a day
    // nobody typed is worse than a field that stays empty.
    expect(dayFromText('31-02-2026')).toBeNull()
    expect(dayFromText('32-01-2026')).toBeNull()
    expect(dayFromText('21-13-2026')).toBeNull()
  })

  it('refuses what is not a date at all', () => {
    expect(dayFromText('')).toBeNull()
    expect(dayFromText('tomorrow')).toBeNull()
  })

  // OVERTURNED ON 24-08, and the name carries the reason so nobody re-argues it from the old
  // one. This used to sit in the test above as `dayFromText('21-08')` being null. `2707` already
  // infers the year, so refusing the same omission when a separator is present contradicted the
  // rule beside it — and a separator does not change what is ambiguous. A day and a month are not.
  it('takes a day and a month without a year, because the digits form already does', () => {
    expect(dayFromText('21-08', '2026-03-09')).toBe('2026-08-21')
    expect(dayFromText('27/08', '2026-03-09')).toBe('2026-08-27')
  })
})

// SHORT DATE ENTRY, which is the whole reason anybody types in this field rather than clicking
// the calendar. The spec is `dd-mm-yyyy`, and what is left off comes from the date the field is
// already holding.
describe('typing a date short', () => {
  // A back-dated invoice, so a reference that is NOT today proves the missing parts come from
  // the field rather than from the wall calendar.
  const REFERENCE = '2026-03-09'

  it('takes a bare day as this month and this year', () => {
    expect(dayFromText('27', REFERENCE)).toBe('2026-03-27')
    expect(dayFromText('5', REFERENCE)).toBe('2026-03-05')
  })

  it('takes four digits as day and month, in the year already held', () => {
    expect(dayFromText('2707', REFERENCE)).toBe('2026-07-27')
  })

  it('takes six digits as day, month and a two-digit year', () => {
    expect(dayFromText('270726', REFERENCE)).toBe('2026-07-27')
    expect(dayFromText('010131', REFERENCE)).toBe('2031-01-01')
  })

  it('takes eight digits as the whole date', () => {
    expect(dayFromText('27072026', REFERENCE)).toBe('2026-07-27')
  })

  it('REFUSES odd lengths rather than guessing which half is which', () => {
    // Three digits could be d-mm or dd-m, five could be two different things. A field that
    // guesses wrong on a date is worse than one that waits.
    expect(dayFromText('270', REFERENCE)).toBeNull()
    expect(dayFromText('27072', REFERENCE)).toBeNull()
    expect(dayFromText('2707202', REFERENCE)).toBeNull()
  })

  it('accepts any of the three separators, with or without the year', () => {
    expect(dayFromText('27.07.2026', REFERENCE)).toBe('2026-07-27')
    expect(dayFromText('27/07/2026', REFERENCE)).toBe('2026-07-27')
    expect(dayFromText('27-07-26', REFERENCE)).toBe('2026-07-27')
    expect(dayFromText('27-07', REFERENCE)).toBe('2026-07-27')
  })

  it('still refuses a day that does not exist, however it was typed', () => {
    expect(dayFromText('3102', REFERENCE)).toBeNull()
    expect(dayFromText('31-02-2026', REFERENCE)).toBeNull()
    expect(dayFromText('3202', REFERENCE)).toBeNull()
  })

  it('reads back out with hyphens whatever went in', () => {
    // Ruled on 24-08: v2 shows slashes, the listing already shows hyphens on every row, and one
    // product does not get two conventions.
    expect(dayText(dayFromText('27/07/2026', REFERENCE)!)).toBe('27-07-2026')
  })
})

// THE MONTH A PANEL DRAWS. Its own tests because a calendar that is one row short in February,
// or that changes height as you page through the year, moves every control under it — and the
// panel is anchored to a field, so it would move the field's own neighbours.
describe('the month a calendar draws', () => {
  it('is always six rows of seven, whatever the month does', () => {
    // February 2026 starts on a Sunday and has 28 days — exactly four weeks, the month most
    // likely to come out short.
    expect(monthGrid('2026-02-15')).toHaveLength(42)
    expect(monthGrid('2026-08-15')).toHaveLength(42)
    expect(monthGrid('2027-01-01')).toHaveLength(42)
  })

  it('starts on the Sunday on or before the first of the month', () => {
    // 1 August 2026 is a Saturday, so the grid opens on 26 July.
    expect(monthGrid('2026-08-15')[0]).toEqual({ day: '2026-07-26', inMonth: false })
  })

  it('marks which cells belong to the month, so the others can be drawn quieter', () => {
    const grid = monthGrid('2026-08-15')
    const inside = grid.filter((cell) => cell.inMonth)
    expect(inside).toHaveLength(31)
    expect(inside[0]!.day).toBe('2026-08-01')
    expect(inside[30]!.day).toBe('2026-08-31')
  })

  it('walks whole months without landing on a day that does not exist', () => {
    // 31 January plus a month is the classic overflow — a naive shift gives 3 March.
    expect(monthShifted('2026-01-31', 1)).toBe('2026-02-01')
    expect(monthShifted('2026-01-15', -1)).toBe('2025-12-01')
    expect(monthShifted('2026-12-15', 1)).toBe('2027-01-01')
  })

  it('counts days across a month end and a year end', () => {
    expect(daysAfter('2026-08-21', 30)).toBe('2026-09-20')
    expect(daysAfter('2026-12-31', 1)).toBe('2027-01-01')
    expect(daysAfter('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('names the month it is showing', () => {
    expect(monthTitle('2026-08-21')).toBe('August 2026')
    expect(monthStart('2026-08-21')).toBe('2026-08-01')
  })
})
