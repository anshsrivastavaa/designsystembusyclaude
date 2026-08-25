import { describe, expect, it } from 'vitest'

import { checked } from './checked'
import type { DataAdapter } from './adapter'
import { isRefusal } from './schema/refusal'

// NOTHING ABOVE THE SEAM EVER SEES A REJECTED PROMISE.
//
// There was not one `.catch` in the whole application, so an unreachable backend left the listing
// on "Loading invoices…" for ever with the real error in a console nobody has open. A catch per
// call site is a branch somebody forgets on the fourteenth screen; the seam catches once.

/** An adapter where every call falls over, which is what a dead backend looks like from here. */
function dead(): DataAdapter {
  const fall = () => Promise.reject(new Error('ECONNREFUSED'))
  return new Proxy({} as DataAdapter, { get: () => fall })
}

describe('a backend that cannot be reached', () => {
  it('arrives as a refusal rather than a rejection', async () => {
    const answer = await checked(dead()).listInvoices({ search: '' })

    expect(isRefusal(answer)).toBe(true)
    expect(isRefusal(answer) && answer.code).toBe('unreachable')
  })

  it('says try again, because very often you can', async () => {
    const answer = await checked(dead()).getInvoice('any')

    // The opposite of what a malformed answer says: a wrong shape will come back wrong, and
    // telling somebody to report a network blip wastes their time and ours.
    expect(isRefusal(answer) && answer.message).toContain('try again')
  })

  it('covers every method, including the ones nobody thought to wrap', async () => {
    const adapter = checked(dead())
    const every = [
      adapter.listItems(''),
      adapter.listParties(''),
      adapter.invoiceSettings(),
      adapter.listSundries(''),
      adapter.partyInsights('p1'),
      adapter.saveInvoice({} as never),
      adapter.attachFile('a.pdf', 0),
    ]

    for (const answer of await Promise.all(every)) {
      expect(isRefusal(answer)).toBe(true)
    }
  })
})
