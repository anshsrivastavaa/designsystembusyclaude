import { describe, it, expect } from 'vitest'

import type { Cursor } from './keyboard'
import { COLUMNS, columnsFor, enterNeedsNewRow, isEditable, onArrow, onEnter, onTab } from './keyboard'

describe('the keyboard walk', () => {
  it('walks Item, Qty, Price, then the next row', () => {
    expect(onEnter({ row: 0, column: 'item' }, 10)).toEqual({ row: 0, column: 'quantity' })
    expect(onEnter({ row: 0, column: 'quantity' }, 10)).toEqual({ row: 0, column: 'price' })
    expect(onEnter({ row: 0, column: 'price' }, 10)).toEqual({ row: 1, column: 'item' })
  })

  it('does not walk into the worked-out columns on Enter', () => {
    const visited = ['item', 'quantity', 'price'].map((column) =>
      onEnter({ row: 0, column: column as never }, 10).column,
    )
    expect(visited).not.toContain('amount')
    expect(visited).not.toContain('serial')
  })

  it('says when Enter on the last row needs a row that does not exist yet', () => {
    expect(enterNeedsNewRow({ row: 9, column: 'price' }, 10)).toBe(true)
    expect(enterNeedsNewRow({ row: 8, column: 'price' }, 10)).toBe(false)
    expect(enterNeedsNewRow({ row: 9, column: 'item' }, 10)).toBe(false)
  })

  it('reaches every column ON THE SCREEN with the arrow keys, including the worked-out ones', () => {
    // Every column this invoice is SHOWING, not every column that can exist. COLUMNS is the
    // vocabulary — thirteen names, of which a given company shows six to eleven — and walking
    // the vocabulary would assert a walk through columns nobody has switched on.
    const shown = columnsFor('itemExclusive', { discount: true, alias: true, hsn: true, mrp: true, freeQuantity: true })
    let cursor: Cursor = { row: 0, column: shown[0]! }
    const seen = [cursor.column]
    for (let step = 0; step < shown.length; step += 1) {
      cursor = onArrow(cursor, 'right', 10, shown)
      seen.push(cursor.column)
    }
    expect(new Set(seen).size).toBe(shown.length)
    // With every optional column on, that IS all thirteen.
    expect(shown.length).toBe(COLUMNS.length)
  })

  it('stops at the edges rather than wrapping round', () => {
    expect(onArrow({ row: 0, column: 'serial' }, 'left', 10)).toEqual({ row: 0, column: 'serial' })
    expect(onArrow({ row: 0, column: 'amount' }, 'right', 10)).toEqual({ row: 0, column: 'amount' })
    expect(onArrow({ row: 0, column: 'item' }, 'up', 10)).toEqual({ row: 0, column: 'item' })
    expect(onArrow({ row: 9, column: 'item' }, 'down', 10)).toEqual({ row: 9, column: 'item' })
  })

  it('tabs through the editable fields of a row and then leaves the grid', () => {
    expect(onTab({ row: 0, column: 'item' }, false)).toEqual({ row: 0, column: 'quantity' })
    expect(onTab({ row: 0, column: 'quantity' }, false)).toEqual({ row: 0, column: 'unit' })
    expect(onTab({ row: 0, column: 'unit' }, false)).toEqual({ row: 0, column: 'price' })
    // AMOUNT IS NOW A STOP, which reverses the first build's ruling. Somebody given a figure —
    // "make it two thousand" — should not have to divide it by the quantity in their head.
    expect(onTab({ row: 0, column: 'price' }, false)).toEqual({ row: 0, column: 'amount' })
    expect(onTab({ row: 0, column: 'amount' }, false)).toBe('leave')
  })

  it('stops asking about Unit once the row has an item that came with one', () => {
    expect(onTab({ row: 0, column: 'quantity' }, false, true)).toEqual({ row: 0, column: 'price' })
    expect(onTab({ row: 0, column: 'price' }, true, true)).toEqual({ row: 0, column: 'quantity' })
  })

  it('still reaches Unit with the arrow keys when the tab order has stopped offering it', () => {
    expect(onArrow({ row: 0, column: 'quantity' }, 'right', 10)).toEqual({ row: 0, column: 'unit' })
  })

  it('tabs backwards the same way and leaves at the front', () => {
    expect(onTab({ row: 0, column: 'price' }, true)).toEqual({ row: 0, column: 'unit' })
    expect(onTab({ row: 0, column: 'item' }, true)).toBe('leave')
  })

  it('knows which columns are worked out and cannot be typed into', () => {
    expect(isEditable('serial')).toBe(false)
    // The tax columns are the invoice's own arithmetic: the rate comes from the item and the
    // tax follows from it, so neither is typed over on a line.
    expect(isEditable('taxPercent')).toBe(false)
    expect(isEditable('taxAmount')).toBe(false)
    // Amount IS typed into, since 21-08 — typing it works the price backwards.
    expect(isEditable('amount')).toBe(true)
    expect(isEditable('item')).toBe(true)
    expect(isEditable('quantity')).toBe(true)
    expect(isEditable('unit')).toBe(true)
    expect(isEditable('price')).toBe(true)
  })
})

describe('Enter from a column the typing walk never visits', () => {
  it('asks for a new row when it is on the last one, so the cursor has somewhere to land', () => {
    expect(enterNeedsNewRow({ row: 9, column: 'unit' }, 10)).toBe(true)
    expect(enterNeedsNewRow({ row: 5, column: 'unit' }, 10)).toBe(false)
  })

  it('drops to the next row rather than carrying on across this one', () => {
    expect(onEnter({ row: 5, column: 'unit' }, 10)).toEqual({ row: 6, column: 'item' })
  })
})
