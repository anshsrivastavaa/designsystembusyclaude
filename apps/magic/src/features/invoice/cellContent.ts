// What a cell shows when the cursor is somewhere else, and which way it is aligned. Its own
// file because both the row and the cell need it, and having them read it from each other is
// a circle — which is what the import-cycle rule caught the moment it was written.

import { formatPaise } from '../../lib/money'
import { isEditable, type ColumnId } from '../../lib/keyboard'
import type { InvoiceRow } from '../../data/schema/invoice'
import type { ItemFacts } from './cellHands'

// ONE ItemFacts, and it lives in cellHands.ts with the store's own shape. This file used to
// declare a three-field version of its own; it compiled only because that was a structural
// subset of the real one, so the two could drift for as long as nobody added a field to the
// narrow one. Two types with one name is the defect, not the field count.

export function readOnlyText(row: InvoiceRow, column: ColumnId, index: number, facts?: ItemFacts): string {
  if (column === 'serial') return String(index + 1)
  if (column === 'item') return row.itemName
  if (column === 'quantity') return row.quantity === 0 ? '' : String(row.quantity)
  if (column === 'unit') return row.unit
  if (column === 'price') return row.pricePaise === 0 ? '' : formatPaise(row.pricePaise)

  // An empty row is padding, not a line worth nothing. Thirteen 0.00s down an empty grid is
  // noise that reads as data.
  if (row.itemId === null) return ''

  if (column === 'taxPercent') {
    // The treatment, not a rate of zero. "Nil" and "Exempt" are different facts and a return
    // groups by them; three columns of 0% would say the same wrong thing about all three.
    if (row.taxTreatment === 'nil') return 'Nil'
    if (row.taxTreatment === 'exempt') return 'Exempt'
    if (row.taxTreatment === 'zeroRated') return '0% (exp)'
    return `${row.taxPercent}%`
  }
  if (column === 'taxAmount') return formatPaise(taxOnRow(row))
  if (column === 'alias') return facts?.alias ?? ''
  if (column === 'hsn') return facts?.hsn ?? ''
  if (column === 'mrp') return facts === undefined ? '' : formatPaise(facts.mrpPaise)
  if (column === 'freeQuantity') return row.freeQuantity === 0 ? '' : String(row.freeQuantity)
  // NOTHING WHEN THERE IS NO DISCOUNT — not "0", and not a bare per-cent sign. A column of
  // empty per-cent signs down an untouched invoice reads as data that has not loaded.
  if (column === 'discount') return row.discountPercent === 0 ? '' : `${row.discountPercent}%`

  return formatPaise(row.amountPaise)
}

/** What this line's tax comes to on its own. The per-row figure is the tax on the goods in
 * THIS row and nothing else — a taxable charge spread across the invoice is added to the tax
 * TOTAL and never here, or the column would stop reconciling against the line beside it. */
export function taxOnRow(row: InvoiceRow): number {
  if (row.taxTreatment !== 'taxable') return 0
  return Math.round((row.amountPaise * row.taxPercent) / 100)
}

/** Numbers line up on the right so a column of amounts can be read down. */
export function alignmentOf(column: ColumnId): 'start' | 'end' {
  return column === 'item' || column === 'unit' ? 'start' : 'end'
}

export const cellIsEditable = isEditable
