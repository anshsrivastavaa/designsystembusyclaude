import { describe, expect, it } from 'vitest'

import { orderedColumns } from './gridOrder'

describe('the order a person dragged, folded over the columns this tax mode shows', () => {
  it('leaves the order alone when nobody has dragged anything', () => {
    expect(orderedColumns(['serial', 'item', 'quantity'], [])).toEqual(['serial', 'item', 'quantity'])
  })

  it('honours what was dragged', () => {
    expect(orderedColumns(['serial', 'item', 'quantity'], ['quantity', 'serial', 'item'])).toEqual([
      'quantity', 'serial', 'item',
    ])
  })

  it('drops a column the recorded order names but the tax mode no longer shows', () => {
    // billWise takes the tax columns away entirely. An order recorded under itemExclusive still
    // names them, and naming a column that is not on the screen must not put it back.
    expect(orderedColumns(['serial', 'item', 'amount'], ['amount', 'taxPercent', 'serial', 'item'])).toEqual([
      'amount', 'serial', 'item',
    ])
  })

  it('puts a column switched on AFTER the drag beside the column it naturally follows', () => {
    // MRP naturally sits between Unit and Price. The recorded order has never heard of it, and
    // appending it would land it after Amount, where it reads as a column that arrived broken.
    expect(
      orderedColumns(['item', 'unit', 'mrp', 'price', 'amount'], ['amount', 'item', 'unit', 'price']),
    ).toEqual(['amount', 'item', 'unit', 'mrp', 'price'])
  })

  it('puts a new FIRST column at the front rather than after whatever was dragged there', () => {
    // Item Alias naturally follows Item Name. With Item Name dragged to the end there is no
    // placed column before the alias at all, so the front is the only honest answer.
    expect(orderedColumns(['alias', 'item', 'quantity'], ['quantity', 'item'])).toEqual([
      'alias', 'quantity', 'item',
    ])
  })

  it('keeps two newly-shown neighbours in their own natural order', () => {
    expect(
      orderedColumns(['serial', 'item', 'alias', 'hsn', 'quantity'], ['quantity', 'serial', 'item']),
    ).toEqual(['quantity', 'serial', 'item', 'alias', 'hsn'])
  })
})
