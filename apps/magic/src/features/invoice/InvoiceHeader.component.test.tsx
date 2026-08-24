// THE FAVOURITE STAR SAYS WHICH STATE IT IS IN, AND THE FILL IS THE PART THE EYE READS.
//
// Two greys were carrying this alone: a star that only changes ink between two greys says
// nothing to somebody who has never seen the other state, and nothing at all to somebody who
// cannot tell the two greys apart. `aria-pressed` is a state only assistive software reports.
//
// So the fill is asserted as the BROWSER PAINTED IT, not as a prop that was passed and not as a
// class name. A class name is a proxy for the fill, and this codebase has already been caught
// believing a comment over a rendering.

import { afterEach, describe, expect, it } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import '../../index.css'
import { InvoiceHeader } from './InvoiceHeader'

const hosts: HTMLDivElement[] = []

/** Mounts a header in its own host and lets React commit.
 *
 * TWO THINGS THIS HAS ALREADY BEEN CAUGHT BY. `mounted` renders CONCURRENTLY, so asserting on
 * the very next line finds an empty host — which reads exactly like the component rendering
 * nothing at all. And unmounting a host and mounting into it again leaves nothing to query, so
 * each state gets its own host rather than taking turns in one. */
async function show(favourite: boolean): Promise<HTMLDivElement> {
  const host = document.createElement('div')
  document.body.appendChild(host)
  hosts.push(host)
  mounted(
    host,
    <InvoiceHeader
      type="Invoice"
      onSwitch={() => {}}
      favourite={favourite}
      onFavourite={() => {}}
      onBack={() => {}}
      onAttach={() => {}}
      onSettings={() => {}}
    />,
  )
  // Waited for, not slept past. One tick was enough often enough to look right and then failed
  // — the same shape as the flow flake this suite has already been through.
  for (let tries = 0; tries < 100 && host.querySelector('button[aria-pressed]') === null; tries += 1) {
    await new Promise((settle) => setTimeout(settle, 5))
  }
  return host
}

/** THE SHAPE THAT WAS DRAWN, not the colour it was drawn in.
 *
 * Comparing the computed `fill` was tried first and it is a TRAP: the outline star is painted in
 * ink too, so the two states differ in colour whether or not the fill state does anything at
 * all. That assertion passes with the `filled` prop deleted. What "filled" actually means is a
 * DIFFERENT PATH, so the geometry is what gets compared. */
function starShape(host: HTMLDivElement): string {
  const drawn = star(host).querySelector('svg')!
  return [...drawn.querySelectorAll('path')].map((path) => path.getAttribute('d')).join(' ')
}

/** The ink, which is the second of the ways this control says what it is. */
function starInk(host: HTMLDivElement): string {
  return getComputedStyle(star(host).querySelector('svg')!).fill
}

function star(host: HTMLDivElement): HTMLElement {
  return host.querySelector<HTMLElement>('button[aria-pressed]')!
}

afterEach(() => {
  unmountAll()
  for (const host of hosts) host.remove()
  hosts.length = 0
})

describe('the favourite star', () => {
  it('is filled when the invoice is a favourite and hollow when it is not', async () => {
    const off = await show(false)
    const on = await show(true)

    // A star was drawn at all, so a pair of empty strings can never agree their way to green.
    expect(starShape(off).length).toBeGreaterThan(0)
    // The SHAPE changes. This is the one that fails if Icon ever loses its filled state.
    expect(starShape(on)).not.toBe(starShape(off))
    // And the ink changes too, which is the second channel — neither carries this alone.
    expect(starInk(on)).not.toBe(starInk(off))
  })

  it('says which state it is in in words, because a shape alone is not a label', async () => {
    expect(star(await show(true)).getAttribute('aria-label')).toBe('Added to favourites')
    expect(star(await show(false)).getAttribute('aria-label')).toBe('Add to favourites')
  })
})
