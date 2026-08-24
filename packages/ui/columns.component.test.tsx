// The column engine, measured through a real table rather than by reading its arithmetic.
//
// THIS IS WHERE AJ'S TANSTACK RULING IS EXPOSED. The ruling rests on one claim: that freezing a
// column is a sticky-position offset rather than the bookkeeping a table library exists to do.
// The corner cells are the hard part — a pinned column's header is sticky at the top AND at the
// side at once, and has to out-rank both the heading row it sits in and the pinned cells under
// it. The totals cell is the same problem upside down.
//
// Every assertion here asks what is actually PAINTED, because a z-index that computes correctly
// and paints wrong is the whole failure mode. Two of the three first passed with the fault
// planted and had to be rewritten: one sampled at the very left edge where only the pinned cell
// exists, and one asked merely whether SOMETHING in the totals bar was painted when both cells
// overlap that point. A probe that cannot see the competition proves nothing.

import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { useColumns } from './columns'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'
import { Table } from './Table'
import type { TableColumn } from './TableColumn'

type Row = { no: string; party: string; dead?: boolean }

const ROWS: Row[] = [
  { no: '4/2026-27', party: 'Innovate Solutions' },
  { no: '9/2026-27', party: 'Sharma Traders' },
  { no: '11/2026-27', party: 'Zenith Industries' },
]

const COLUMNS: TableColumn<Row>[] = [
  { id: 'no', header: 'Invoice No.', cell: (row) => row.no },
  { id: 'party', header: 'Party Name', cell: (row) => row.party },
]

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  unmountAll()
  host.remove()
})

function Frozen() {
  const layout = useColumns({
    columns: COLUMNS.map((column) => ({ id: column.id })),
    widths: { no: 160, party: 300 },
    onResize: () => {},
    pins: { start: ['no'], end: [] },
  })
  return (
    <div data-role="scroller" className="h-40 w-80 overflow-auto">
      <Table
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(row) => row.no}
        label="Invoices"
        empty={<p>None</p>}
        totals={{ party: 'Total' }}
        layout={layout}
      />
    </div>
  )
}

describe('freezing a column', () => {
  it('keeps the pinned column, the heading and the totals all in place at once', async () => {
    const at = document.createElement('div')
    host.appendChild(at)
    mounted(at, <Frozen />)
    await settled(() => at.querySelector('tbody tr') !== null)

    const scroller = at.querySelector<HTMLElement>('[data-role="scroller"]')!
    scroller.scrollLeft = 200
    scroller.scrollTop = 60
    await settled(() => scroller.scrollLeft > 0)

    // It has to have actually scrolled sideways, or nothing below is testing a pin at all.
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)
    expect(scroller.scrollLeft).toBeGreaterThan(0)

    const box = scroller.getBoundingClientRect()
    const paintedAt = (x: number, y: number) =>
      document.elementFromPoint(box.left + x, box.top + y)?.closest('th, td')

    // SAMPLED WHERE THE TWO ACTUALLY OVERLAP. At the very left edge only the pinned cell
    // exists, so a probe there answers the same whatever the z-order is — which is the
    // "harness never overflowed" fault this suite has already been bitten by once. The
    // scrolled-away heading reaches into the pinned column, and that overlap is the test.
    const scrolledHeader = [...at.querySelectorAll('thead th')][1]!.getBoundingClientRect()
    const overlap = Math.round(scrolledHeader.left - box.left) + 12
    expect(overlap).toBeLessThan(160)

    expect(paintedAt(overlap, 8)?.tagName).toBe('TH')
    expect(paintedAt(overlap, 8)?.textContent).toContain(COLUMNS[0]!.header)

    // The totals bar's own corner, sampled at the same overlap. A pinned column keeps its own
    // totals cell rather than being swallowed by the spanning label, because a cell that spans
    // several columns cannot be frozen to any one of them.
    const totalsRow = at.querySelector('tfoot td')!.getBoundingClientRect()
    const foot = paintedAt(overlap, Math.round(totalsRow.top - box.top + totalsRow.height / 2))
    expect(foot).not.toBeNull()
    expect(foot!.closest('tfoot')).not.toBeNull()
    // THE FROZEN ONE, not merely "a totals cell". Both cells overlap this point and both are
    // sticky, so asking only whether something in the tfoot was painted answers the same either
    // way — which is how the first version of this assertion passed with the fault planted.
    // The frozen cell is the one still held against the scroller's own left edge.
    expect(Math.round(foot!.getBoundingClientRect().left - box.left)).toBe(0)
    // Its OWN cell, not the spanning label: a cell across several columns has no single offset
    // that could mean "frozen to this one".
    expect(foot!.getAttribute('colspan')).toBeNull()
  })

  it('gives a pinned cell a background, so the scrolled rows do not show through it', async () => {
    const at = document.createElement('div')
    host.appendChild(at)
    mounted(at, <Frozen />)
    await settled(() => at.querySelector('tbody tr') !== null)

    const pinned = at.querySelector<HTMLElement>('tbody tr td')!
    // toBeVisible would pass on a transparent cell. The fault is a cell you can SEE THROUGH, so
    // the question is the alpha channel, not whether a colour is set.
    const alpha = Number(getComputedStyle(pinned).backgroundColor.split(',')[3]?.replace(')', '') ?? '1')
    expect(alpha).toBeGreaterThan(0)
    expect(getComputedStyle(pinned).position).toBe('sticky')
  })
})

// Resizing. The handle is a control, so the keyboard half is tested as seriously as the mouse
// half — a resize only a mouse can perform fails WCAG 2.1.1, and this product is keyboard-first.
function Resizable({ onResize, widths }: { onResize: (id: string, width: number) => void; widths: Record<string, number> }) {
  const layout = useColumns({
    columns: [{ id: 'no', minWidth: 80 }, { id: 'party' }],
    widths,
    onResize,
    pins: { start: [], end: [] },
  })
  return (
    <Table columns={COLUMNS} rows={ROWS} getRowId={(row) => row.no} label="Invoices" empty={<p>None</p>} layout={layout} />
  )
}

describe('resizing a column', () => {
  const handle = () => host.querySelector<HTMLElement>('[role="separator"]')!

  it('is reachable and operable from the keyboard, not the mouse alone', async () => {
    const asked: { id: string; width: number }[] = []
    mounted(host, <Resizable widths={{ no: 200 }} onResize={(id, width) => asked.push({ id, width })} />)
    await settled(() => host.querySelector('[role="separator"]') !== null)

    handle().focus()
    expect(document.activeElement).toBe(handle())
    expect(handle().getAttribute('aria-orientation')).toBe('vertical')
    expect(handle().getAttribute('aria-valuenow')).toBe('200')

    handle().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await settled(() => asked.length > 0)
    expect(asked.at(-1)!.width).toBeGreaterThan(200)

    handle().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    await settled(() => asked.length > 1)
    expect(asked.at(-1)!.width).toBeLessThan(200)
  })

  it('will not let a column be dragged narrower than it can be read', async () => {
    // Held in real state, because the clamp only shows itself on the press that would cross the
    // floor — a harness that forgets each answer never gets there.
    function Narrowing() {
      const [widths, setWidths] = useState<Record<string, number>>({ no: 90 })
      return <Resizable widths={widths} onResize={(id, width) => setWidths({ [id]: width })} />
    }
    mounted(host, <Narrowing />)
    await settled(() => host.querySelector('[role="separator"]') !== null)

    const press = async (expected: number) => {
      handle().focus()
      handle().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
      await settled(() => handle().getAttribute('aria-valuenow') === String(expected))
    }

    // A floor of 80 from a start of 90. Without the clamp the second press reaches 74.
    await press(82)
    await press(80)
    await press(80)
    expect(handle().getAttribute('aria-valuenow')).toBe('80')
  })

  it('does not answer to a key that means something else', async () => {
    const asked: number[] = []
    mounted(host, <Resizable widths={{ no: 200 }} onResize={(_, width) => asked.push(width)} />)
    await settled(() => host.querySelector('[role="separator"]') !== null)

    handle().focus()
    handle().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    handle().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(asked).toEqual([])
  })
})
