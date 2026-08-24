import { afterEach, describe, expect, it, vi } from 'vitest'

import { dayFromText, dayText, today } from './day'

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
    expect(dayFromText('21-08')).toBeNull()
  })
})
