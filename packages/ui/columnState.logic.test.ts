// The pure arithmetic of the column engine, tested without a browser because none of it needs
// one. These moved here whole with `reorder` itself: they were the listing's, and column order
// is the third thing both tables share.

import { describe, expect, it } from 'vitest'

import { edgeFor, isBoundary, pinThrough, reorder } from './columnState'

describe('dragging a column into a new place', () => {
  const order = ['date', 'number', 'party', 'total']

  it('moves one along without disturbing the others', () => {
    expect(reorder(order, 'total', 1)).toEqual(['date', 'total', 'number', 'party'])
  })

  it('accounts for the index shifting when the moved column came from earlier', () => {
    // The fiddly one: taking 'date' out moves every remaining index down by one, so a naive
    // splice at 2 puts it in the wrong gap. Dropped on 'party' at index 2, it lands after it.
    expect(reorder(order, 'date', 2)).toEqual(['number', 'party', 'date', 'total'])
  })

  it('clamps rather than losing a column off either end', () => {
    expect(reorder(order, 'date', 99)).toEqual(['number', 'party', 'total', 'date'])
    expect(reorder(order, 'total', -5)).toEqual(['total', 'date', 'number', 'party'])
  })

  it('keeps every column, always', () => {
    expect(reorder(order, 'party', 0)).toHaveLength(order.length)
  })
})

describe('pinning, which is a boundary rather than a switch', () => {
  const order = ['no', 'item', 'qty', 'price', 'tax']

  // The product document: "pinning the fourth column from the left freezes columns one to four
  // together; a single column cannot be frozen while the ones left of it scroll."
  it('freezes everything from the edge up to the column pressed, not that column alone', () => {
    expect(pinThrough(order, 'item', 'start')).toEqual({ start: ['no', 'item'], end: [] })
  })

  it('freezes from the column pressed to the far edge, going the other way', () => {
    expect(pinThrough(order, 'price', 'end')).toEqual({ start: [], end: ['price', 'tax'] })
  })

  it('holds BOTH edges at once, so the middle is what scrolls', () => {
    // Aj's shape, and v2's: Sr. and Item Name held left, Amount held right, the rest travelling
    // between them. This is what the old signature could not do — it cleared the opposite edge on
    // every press, so a right pin threw a left one away.
    const left = pinThrough(order, 'item', 'start')
    const both = pinThrough(order, 'price', 'end', left)

    expect(both.start).toEqual(['no', 'item'])
    expect(both.end).toEqual(['price', 'tax'])
  })

  it('releases only the edge pressed, and leaves the other standing', () => {
    const both = pinThrough(order, 'price', 'end', pinThrough(order, 'item', 'start'))
    const released = pinThrough(order, 'price', 'end', both)

    expect(released.end).toEqual([])
    expect(released.start).toEqual(['no', 'item'])
  })

  it('will not freeze one column to both edges — the newer press wins', () => {
    const wideLeft = pinThrough(order, 'price', 'start')
    expect(wideLeft.start).toEqual(['no', 'item', 'qty', 'price'])

    // Now pin `qty` to the right. It is inside the left block, so the left block gives way.
    const clashed = pinThrough(order, 'qty', 'end', wideLeft)
    expect(clashed.end).toEqual(['qty', 'price', 'tax'])
    expect(clashed.start).toEqual(['no', 'item'])
  })

  it('knows which column is holding a boundary open, so one control can also release it', () => {
    const left = pinThrough(order, 'item', 'start')
    expect(isBoundary(left, 'item')).toBe('start')
    // The ones behind the boundary are frozen but are not the thing a second press releases.
    expect(isBoundary(left, 'no')).toBeNull()
    expect(isBoundary(pinThrough(order, 'price', 'end'), 'price')).toBe('end')
  })

  it('the alignment chooses the edge, so nobody is asked which side', () => {
    // Every money and quantity column is right-aligned, and those are exactly the ones that
    // should hold against the right edge. The question has already been answered by what kind of
    // number the column holds.
    expect(edgeFor('end')).toBe('end')
    expect(edgeFor('start')).toBe('start')
    expect(edgeFor(undefined)).toBe('start')
  })

  it('says nothing is a boundary when nothing is pinned', () => {
    expect(isBoundary({ start: [], end: [] }, 'no')).toBeNull()
  })

  it('answers with nothing for a column that is not in the order at all', () => {
    expect(pinThrough(order, 'nonesuch', 'start')).toEqual({ start: [], end: [] })
  })
})
