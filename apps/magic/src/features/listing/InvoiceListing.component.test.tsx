// The listing works the list out once, and moving the cursor is not a reason to do it again.
//
// This is a test about COST, which is why it counts calls rather than looking at the screen.
// Every stage of the pipeline used to sit in the render body, and this component re-renders on
// every arrow key because moving the cursor is a change to the store. Sixty-five mock invoices
// hide that completely. Two thousand — which is a year's trading in a small book — do not, and
// the requirement is that the screen answers inside a tenth of a second.
//
// The counters wrap the real functions rather than replacing them, so the screen underneath is
// the real screen and a broken pipeline still fails the rest of the suite.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import { settled } from '@busy/ui/settled'
import '../../index.css'
import { InvoiceListing } from './InvoiceListing'
import { useListing } from './store'

const ran = { narrow: 0, sorted: 0, grouped: 0, page: 0 }

vi.mock('./filtering', async (importOriginal) => {
  const real = await importOriginal<typeof import('./filtering')>()
  return {
    ...real,
    narrow: (...args: Parameters<typeof real.narrow>) => (ran.narrow += 1, real.narrow(...args)),
    sorted: (...args: Parameters<typeof real.sorted>) => (ran.sorted += 1, real.sorted(...args)),
    grouped: (...args: Parameters<typeof real.grouped>) => (ran.grouped += 1, real.grouped(...args)),
    page: (...args: Parameters<typeof real.page>) => (ran.page += 1, real.page(...args)),
  }
})

let host: HTMLDivElement

beforeEach(async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  mounted(host, <InvoiceListing />)
  // The rows come from the adapter, which is deliberately slow. Nothing below means anything
  // until they are on the screen.
  await settled(() => host.querySelectorAll('tbody tr').length > 1)
})

afterEach(() => {
  unmountAll()
  host.remove()
})

const rows = () => [...host.querySelectorAll<HTMLTableRowElement>('tbody tr')]

describe('working the list out', () => {
  it('does not run the pipeline again when only the cursor moved', async () => {
    const before = { ...ran }

    // Ten presses of the down arrow, which is a person holding the key for half a second.
    for (let press = 0; press < 10; press += 1) {
      useListing.getState().moveCursor(press)
      await settled(() => useListing.getState().cursor === press)
    }

    expect(ran).toEqual(before)
  })

  it('still runs it when the answer could actually have changed', async () => {
    const before = ran.narrow

    useListing.getState().setSearch('sharma')
    await settled(() => ran.narrow > before)

    expect(ran.narrow).toBeGreaterThan(before)
  })

  it('has rows to move a cursor through in the first place', () => {
    expect(rows().length).toBeGreaterThan(1)
  })
})
