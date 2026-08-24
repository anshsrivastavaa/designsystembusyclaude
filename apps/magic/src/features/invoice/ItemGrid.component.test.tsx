// The row height must not depend on where the cursor is.
//
// This is the test that only fails when the fault comes back. It came back once already, in a
// way nothing else caught: the row's height class had never been authored, so rows were sized
// by their contents, and the item cell swapping a line of text for a field grew the row by
// three pixels. Enter walks through the item cell on every row, so the line the eye was
// tracking moved on every press.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import '../../index.css'
import { columnsFor } from '../../lib/keyboard'
import { emptyRow } from '../../data/schema/invoice'
import { useInvoice } from './store'
import { ItemGrid } from './ItemGrid'

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  // The host is the SCROLLING COLUMN, which is what the real screen gives the grid: one
  // scroller, a viewport tall, with the whole screen inside it. The grid fills the room that
  // column has left rather than a box it was handed — so the thing under test needs a column
  // to have room in. Written as the viewport rather than a number, because a raw pixel size
  // does not belong outside the token package.
  host.style.height = '100vh'
  host.style.overflowY = 'auto'
  document.body.appendChild(host)
  useInvoice.getState().load(Array.from({ length: 12 }, (_, at) => emptyRow(`row-${at}`)))
  mounted(host, <ItemGrid />)
})

// The grid watches its own size with a ResizeObserver and listens to the window, and it takes
// both down again when it unmounts — but that cleanup only runs if something unmounts it.
// Removing the host element does not: it leaves the tree alive, still measuring, still
// subscribed to a store that the next test is about to change.
afterEach(() => {
  unmountAll()
  host.remove()
})

const settled = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
}

/** The padding arrives a beat after the first paint: the grid has to be measured before it
 * knows how many rows fit. */
/** Waits for the padding to STOP CHANGING, not for it to pass a number.
 *
 * The grid fills the room the page has left, and adding rows changes how much room is left —
 * so the count settles rather than arriving. Waiting for "more than thirteen" caught it
 * mid-growth, and every measurement after that disagreed with the one before for a reason that
 * had nothing to do with what these tests assert. */
async function settledAndPadded() {
  let last = -1
  let steady = 0
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await settled()
    const now = rowHeights().length
    // STEADY ACROSS SEVERAL FRAMES, not merely the same twice. The measurement runs from a
    // ResizeObserver, so the first two frames after mounting are both the un-padded count —
    // "the same as last time" was true before anything had happened at all.
    steady = now === last ? steady + 1 : 0
    if (steady >= 5 && now > 0) return
    last = now
  }
}

/** The item rows, and only those. The heading and the summary row that closes the table are
 * both rows in the accessibility tree, and neither is a line of the invoice — counting them
 * made this test's numbers move for a reason that had nothing to do with what it asserts. */
const rowHeights = () =>
  [...host.querySelectorAll('[role="row"][aria-rowindex]:not([aria-rowindex="1"])')].map(
    (row) => row.getBoundingClientRect().height,
  )

describe('the item grid', () => {
  it('pads itself with empty rows to fill the height it is given', async () => {
    await settledAndPadded()
    // Twelve rows were loaded onto a page with room to spare, so the rest are padding.
    expect(rowHeights().length).toBeGreaterThan(12)
  })

  it('keeps every row the same height wherever the cursor is', async () => {
    await settledAndPadded()
    const resting = rowHeights()
    // The grid pads itself to fill the height it is given, so the count is whatever fits —
    // what must not change is that every row is the same height wherever the cursor is.
    expect(resting.length).toBeGreaterThanOrEqual(12)

    for (const column of columnsFor('itemExclusive')) {
      useInvoice.getState().moveTo({ row: 0, column })
      await settled()
      expect(rowHeights(), `with the cursor on ${column}`).toEqual(resting)
    }
  })

  it('gives every row the height the density token asks for', async () => {
    await settled()
    const probe = document.createElement('div')
    probe.style.height = 'var(--row-h)'
    host.appendChild(probe)
    const fromToken = probe.getBoundingClientRect().height
    probe.remove()

    expect(new Set(rowHeights())).toEqual(new Set([fromToken]))
  })

  it('holds the grid roles the screen reader reads, since they are written by hand', async () => {
    // Waits for the grid to be DRAWN AND SETTLED, not for one frame. A single frame was enough
    // until the column list was memoised, which changed when the first render lands.
    await settledAndPadded()
    expect(host.querySelector('[role="grid"]')).not.toBeNull()
    // The columns this invoice is SHOWING. COLUMNS is the vocabulary of thirteen names; the
    // default set is the six the product document names plus the two tax columns, and the rest
    // arrive when their setting is switched on.
    expect(host.querySelectorAll('[role="columnheader"]').length).toBe(columnsFor('itemExclusive').length)
    // One header row, then the twelve that were loaded and however many the padding added.
    expect(host.querySelectorAll('[role="row"]').length).toBeGreaterThanOrEqual(13)
    expect(host.querySelectorAll('[role="row"]')[1]!.querySelectorAll('[role="gridcell"]').length).toBe(
      columnsFor('itemExclusive').length,
    )
  })
})
