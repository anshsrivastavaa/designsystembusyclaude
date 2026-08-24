// The pure arithmetic of the column engine, tested without a browser because none of it needs
// one. These moved here whole with `reorder` itself: they were the listing's, and column order
// is the third thing both tables share.

import { describe, expect, it } from 'vitest'

import { isBoundary, pinThrough, reorder } from './columnState'

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

  it('takes one boundary at a time from each edge, so the middle is what scrolls', () => {
    const left = pinThrough(order, 'item', 'start')
    expect(left.start).toEqual(['no', 'item'])
    expect(left.end).toEqual([])
  })

  it('knows which column is holding a boundary open, so one control can also release it', () => {
    const left = pinThrough(order, 'item', 'start')
    expect(isBoundary(left, 'item')).toBe('start')
    // The ones behind the boundary are frozen but are not the thing a second press releases.
    expect(isBoundary(left, 'no')).toBeNull()
    expect(isBoundary(pinThrough(order, 'price', 'end'), 'price')).toBe('end')
  })

  it('says nothing is a boundary when nothing is pinned', () => {
    expect(isBoundary({ start: [], end: [] }, 'no')).toBeNull()
  })

  it('answers with nothing for a column that is not in the order at all', () => {
    expect(pinThrough(order, 'nonesuch', 'start')).toEqual({ start: [], end: [] })
  })
})
