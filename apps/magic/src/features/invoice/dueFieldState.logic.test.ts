import { describe, expect, it } from 'vitest'

import { dueFieldFor } from './dueFieldState'

const on = '2026-08-25'
const billed = { paysAtCounter: false, creditDays: 30 }

describe('whether there is a Due field at all', () => {
  it('has none before a party is chosen', () => {
    // ABSENT, NOT EMPTY AND NOT DISABLED. A disabled field is a promise that it works once you do
    // something; there is nothing to do until somebody is picked.
    expect(dueFieldFor({ party: null, invoiceDate: on, companyDefaultDays: 30 })).toEqual({
      shown: false, because: 'no party',
    })
  })

  it('has none for a party who pays at the counter', () => {
    expect(
      dueFieldFor({ party: { paysAtCounter: true, creditDays: 0 }, invoiceDate: on, companyDefaultDays: 30 }),
    ).toEqual({ shown: false, because: 'pays at the counter' })
  })

  it('ignores the company default for a counter party, because the question does not arise', () => {
    expect(
      dueFieldFor({ party: { paysAtCounter: true, creditDays: 45 }, invoiceDate: on, companyDefaultDays: 30 }).shown,
    ).toBe(false)
  })
})

describe('what is in it once there is one', () => {
  it(`takes the party's own terms first`, () => {
    expect(dueFieldFor({ party: billed, invoiceDate: on, companyDefaultDays: 15 })).toEqual({
      shown: true, value: '2026-09-24', from: 'the party',
    })
  })

  it('falls to the company default when the party has agreed nothing', () => {
    // ZERO DAYS IS "NOTHING AGREED", NOT "DUE TODAY". Reading it as a term would put every invoice
    // to a new customer due on the day it was raised.
    expect(
      dueFieldFor({ party: { paysAtCounter: false, creditDays: 0 }, invoiceDate: on, companyDefaultDays: 15 }),
    ).toEqual({ shown: true, value: '2026-09-09', from: 'the company default' })
  })

  it('is empty and editable when neither has anything to say', () => {
    expect(
      dueFieldFor({ party: { paysAtCounter: false, creditDays: 0 }, invoiceDate: on, companyDefaultDays: null }),
    ).toEqual({ shown: true, value: '', from: 'nobody' })
  })
})
