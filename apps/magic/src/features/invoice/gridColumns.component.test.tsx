// The column engine on the item grid: the two width modes, the sideways scroll and the freeze.
//
// EVERY ONE OF THESE MEASURES THE RENDERING. A width is a promise about the screen, and the
// three faults this file is guarding against — a drag that squeezes a column nobody touched, a
// frozen cell that slides away, a heading that leaves with the page — all type-check perfectly
// and all show up only as pixels in the wrong place.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import '../../index.css'
import { emptyRow } from '../../data/schema/invoice'
import { useInvoice } from './store'
import { useGridLayout } from './gridLayout'
import { ItemGrid } from './ItemGrid'

let host: HTMLDivElement
let setColumnCalls: [string, boolean][]

beforeEach(() => {
  host = document.createElement('div')
  // The host is the SCROLLING COLUMN, which is what the real screen gives the grid: one
  // scroller, a viewport tall, with the whole screen inside it.
  host.style.height = '100vh'
  host.style.overflowY = 'auto'
  document.body.appendChild(host)
  setColumnCalls = []
  useGridLayout.getState().resetColumns()
  useInvoice.getState().load(Array.from({ length: 12 }, (_, at) => emptyRow(`row-${at}`)))
  mounted(host, <ItemGrid onSetColumn={(id, on) => setColumnCalls.push([id, on])} />)
})

afterEach(() => {
  unmountAll()
  host.remove()
  useGridLayout.getState().resetColumns()
})

const settled = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
}

const headingFor = (name: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="columnheader"]')].find(
    (cell) => cell.textContent?.includes(name) === true,
  )!

/** A real drag on a real edge: press, move, release, through the events a pointer sends. */
async function dragEdge(heading: HTMLElement, by: number) {
  const handle = heading.querySelector<HTMLElement>('[role="separator"]')!
  const from = handle.getBoundingClientRect()
  const at = { clientX: Math.round(from.left + from.width / 2), clientY: Math.round(from.top + from.height / 2) }
  handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, ...at }))
  await settled()
  window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: at.clientX + by, clientY: at.clientY }))
  await settled()
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: at.clientX + by, clientY: at.clientY }))
  await settled()
}

describe('the two width modes', () => {
  it('takes every column at its measured width on the first drag, so nobody else moves', async () => {
    await settled()
    const before = headingFor('Item Name').getBoundingClientRect().width
    const priceBefore = headingFor('Price').getBoundingClientRect().width

    await dragEdge(headingFor('Price'), 80)

    // THE FAULT THIS IS NAMED AFTER. Fix one column and leave the rest sharing, and the space
    // the drag took comes out of the only column that still grows — so dragging Price wider
    // visibly narrows Item Name and the number under the cursor is not the number that moved.
    // v2 records it in its own words: "that ballooned Item and collapsed the rest".
    expect(Math.round(headingFor('Item Name').getBoundingClientRect().width)).toBe(Math.round(before))
    expect(headingFor('Price').getBoundingClientRect().width).toBeGreaterThan(priceBefore + 60)
  })

  it('has nothing to scroll sideways until somebody drags, and something to scroll after', async () => {
    // GIVEN ROOM, because the point is the MODE and not the window: share mode fills whatever
    // box it is in, so a box too narrow for the columns would overflow under either mode and
    // the test would pass without the modes existing at all. Written as a multiple of the
    // viewport rather than a number, because a raw pixel size does not belong outside tokens.
    host.style.width = '300vw'
    await settled()
    const sideways = document.querySelector<HTMLElement>('[data-sideways-only="true"]')!
    expect(sideways.scrollWidth).toBeLessThanOrEqual(sideways.clientWidth + 1)

    await dragEdge(headingFor('Price'), 600)
    expect(sideways.scrollWidth).toBeGreaterThan(sideways.clientWidth + 4)
  })
})

describe('the rules between the columns', () => {
  it('puts every heading edge exactly where the body edge under it is', async () => {
    // AT THE WIDTH THE SCREEN IS USED AT, and both halves of that matter: in a box too narrow
    // every column is pinned at its minimum and they land together whatever is wrong with the
    // sharing, and in one far too wide nothing is squeezed so nothing binds. Arithmetic rather
    // than a pixel size, which does not belong outside the token package.
    const deskWidth = 1440
    host.style.width = `${Math.round((deskWidth / window.innerWidth) * 100)}vw`
    await settled()
    const grid = document.querySelector<HTMLElement>('[role="grid"]')!
    const headings = [...grid.querySelectorAll<HTMLElement>('[role="columnheader"]')]
    const body = [...grid.querySelectorAll<HTMLElement>('[role="row"]')].find(
      (row) => row.getAttribute('aria-rowindex') === '3',
    )!
    const cells = [...body.children] as HTMLElement[]

    // MEASURED PER COLUMN, not eyeballed and not summed. Two things had put the heading row and
    // the rows underneath on different grids, both invisible at rest: the column-setup control was
    // a flex SIBLING of the headings, and the freeze pin was a flex child inside each one.
    const drift = headings.map((heading, at) => {
      const under = cells[at]
      if (under === undefined) return 0
      return Math.abs(heading.getBoundingClientRect().left - under.getBoundingClientRect().left)
    })
    expect(Math.max(...drift)).toBeLessThan(0.5)
  })
})

describe('the sideways scroll and the freeze', () => {
  /** Fixed widths wide enough that the grid must be wider than its box, then frozen through the
   * item name — which is the state every assertion below is about. */
  async function widenAndFreeze() {
    await settled()
    await dragEdge(headingFor('Price'), 400)
    useGridLayout.getState().pinColumn('item', 'start', ['serial', 'item', 'quantity'])
    await settled()
    const sideways = document.querySelector<HTMLElement>('[data-sideways-only="true"]')!
    expect(sideways.scrollWidth).toBeGreaterThan(sideways.clientWidth + 4)
    sideways.scrollLeft = 200
    sideways.dispatchEvent(new Event('scroll', { bubbles: true }))
    await settled()
    return sideways
  }

  it('holds the frozen block still while everything right of it travels', async () => {
    const sideways = await widenAndFreeze()
    const box = sideways.getBoundingClientRect()

    // SAMPLED WHERE THE TWO ARE FIGHTING OVER THE SAME PIXELS. The frozen block is held at the
    // left edge and the scrolled columns are passing underneath it, so the point that answers
    // the question is inside the frozen block after a scroll — anywhere else and only one thing
    // ever wanted to be there.
    const name = headingFor('Item Name').getBoundingClientRect()
    expect(name.left).toBeGreaterThanOrEqual(box.left - 1)
    expect(name.left).toBeLessThan(box.left + 100)

    // Quantity is not frozen, so the same scroll has taken it left of where it started. Without
    // this the test passes over a grid that simply did not scroll.
    expect(headingFor('Qty').getBoundingClientRect().left).toBeLessThan(name.left + name.width)
  })

  it('gives a frozen cell its own fill, so the row does not break in half as it travels', async () => {
    await widenAndFreeze()
    const row = [...document.querySelectorAll<HTMLElement>('[role="row"]')][2]!
    const frozen = row.querySelectorAll<HTMLElement>('[role="gridcell"]')[1]!
    const scrolling = row.querySelectorAll<HTMLElement>('[role="gridcell"]')[3]!

    // TRANSPARENT IS THE FAULT. The row carries the fill and the cells are see-through, so a
    // pinned cell held over travelling content shows whatever is passing underneath it.
    //
    // ASKED AGAINST TWO KNOWN ANSWERS RATHER THAN A COLOUR WRITTEN HERE. A colour written into
    // a test is a raw value outside the token package, and it also goes stale the first time
    // anybody moves the surface a step — so the question is put as a comparison: the frozen
    // cell must not read like the see-through one beside it, and it must read like the card it
    // is sitting on.
    const cardFill = getComputedStyle(document.querySelector<HTMLElement>('[role="grid"]')!).backgroundColor
    expect(getComputedStyle(frozen).backgroundColor).not.toBe(getComputedStyle(scrolling).backgroundColor)
    expect(getComputedStyle(frozen).backgroundColor).toBe(cardFill)
  })

  it('keeps a frozen body cell on position sticky, whatever its own children asked for', async () => {
    await widenAndFreeze()
    const row = [...document.querySelectorAll<HTMLElement>('[role="row"]')][2]!
    // The gutter is the one that carries `position: relative` for the delete control laid over
    // it — the cell v2 watched slide sideways because that rule landed later and won.
    const gutter = row.firstElementChild as HTMLElement
    expect(getComputedStyle(gutter).position).toBe('sticky')
  })

  it('freezes a right-aligned column against the RIGHT edge, without being asked which', async () => {
    await settled()
    await dragEdge(headingFor('Price'), 400)
    // AMOUNT IS RIGHT-ALIGNED, so pressing its pin holds it and everything after it against the
    // right edge. Nobody picks a side: the column's alignment has already answered it.
    const amount = headingFor('Taxable')
    amount.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    await settled()
    amount.querySelector<HTMLButtonElement>('button[aria-pressed]')!.click()
    await settled()

    const sideways = document.querySelector<HTMLElement>('[data-sideways-only="true"]')!
    sideways.scrollLeft = 0
    sideways.dispatchEvent(new Event('scroll', { bubbles: true }))
    await settled()
    const held = amount.getBoundingClientRect()
    const box = sideways.getBoundingClientRect()
    // Held against the RIGHT, not the left: its right edge is at the box's right edge while the
    // grid is scrolled all the way back to the start.
    expect(Math.abs(held.right - box.right)).toBeLessThan(2)
    expect(getComputedStyle(amount).position).toBe('sticky')
  })

  it('draws the edge line on the last frozen column and on no other', async () => {
    await widenAndFreeze()
    const edge = getComputedStyle(headingFor('Item Name')).borderRightColor
    const inside = getComputedStyle(headingFor('#')).borderRightColor
    const outside = getComputedStyle(headingFor('Qty')).borderRightColor
    expect(edge).not.toBe(inside)
    expect(inside).toBe(outside)
  })

  it('holds the headings against the page while the grid is scrolled sideways', async () => {
    // ENOUGH ROWS THAT THE PAGE ACTUALLY TRAVELS. Written first with the twelve rows the other
    // tests use, where the column never overflowed: the page could not scroll, the heading
    // therefore never had to hold anything, and the test passed with the stickiness deleted.
    useInvoice.getState().load(Array.from({ length: 120 }, (_, at) => emptyRow(`row-${at}`)))
    const sideways = await widenAndFreeze()
    host.scrollTop = Math.round(host.scrollHeight / 2)
    sideways.scrollLeft = 200
    sideways.dispatchEvent(new Event('scroll', { bubbles: true }))
    await settled()
    expect(host.scrollTop).toBeGreaterThan(100)
    // The heading has to hold its place against the page going down AND against the grid going
    // sideways, and an element can only be sticky inside one scroller — which is why the
    // headings sit in a box of their own that is driven from the rows below.
    const heading = headingFor('#').getBoundingClientRect()
    expect(heading.top).toBeGreaterThanOrEqual(host.getBoundingClientRect().top - 1)
    expect(heading.top).toBeLessThan(host.getBoundingClientRect().top + 40)
  })
})

describe('the setup list', () => {
  it('hands a switched column back to whoever owns the settings', async () => {
    await settled()
    const opener = document.querySelector<HTMLElement>('[aria-label="Column setup"]')!
    opener.click()
    await settled()
    const tick = [...document.querySelectorAll<HTMLElement>('[role="checkbox"], input[type="checkbox"]')].find(
      (box) => box.getAttribute('aria-label')?.startsWith('MRP') === true,
    )!
    tick.click()
    await settled()
    expect(setColumnCalls).toEqual([['mrp', true]])
  })
})
