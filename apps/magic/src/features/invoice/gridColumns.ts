// WHAT EACH ITEM-GRID COLUMN IS CALLED AND HOW WIDE IT SITS.
//
// Out of ItemGrid.tsx, which was at the 250-line cap exactly — the cap correctly saying the file
// was two things: a grid, and a table of facts about columns. `sundryColumns.ts` already keeps
// the same kind of thing for the sundry grid, so this is the sibling that was missing rather
// than a new idea.

import type { ColumnId } from '../../lib/keyboard'

// v2'S OWN WORDS. Ours were shortened past the point of being the same word — "Disc" loses that
// it is a percentage, "HSN" drops the half of the code services use. The gutter is "#", which is
// what a row number column is called; "S.No." is a phrase where a symbol will do.
export const HEADINGS: Record<ColumnId, string> = {
  serial: '#',
  item: 'Item Name',
  alias: 'Item Alias',
  hsn: 'HSN / SAC',
  quantity: 'Qty',
  freeQuantity: 'Free Qty',
  mrp: 'MRP',
  discount: 'Disc%',
  unit: 'Unit',
  price: 'Price',
  taxPercent: 'Tax %',
  taxAmount: 'Tax Amt',
  amount: 'Amount',
}

/** WHAT THE AMOUNT COLUMN IS CALLED, WHICH IS NOT ALWAYS "AMOUNT". Excluding tax it is the
 * TAXABLE value; including tax it is the NETT. The product document says both things in two
 * places and the clash is filed for stakeholders. */
export const AMOUNT_HEADING: Record<'itemExclusive' | 'itemInclusive' | 'billWise', string> = {
  itemExclusive: 'Taxable',
  itemInclusive: 'Nett',
  billWise: 'Amount',
}

export const WIDTHS: Record<ColumnId, string> = {
  // MEASURED OFF v2, not derived: 46px there against 56 here, for a column that holds a
  // two-digit number beside a 34px row. w-12 is 48 and is the nearest stop on the scale.
  serial: 'w-12',
  item: 'flex-1',
  alias: 'w-24',
  hsn: 'w-24',
  quantity: 'w-24',
  freeQuantity: 'w-20',
  mrp: 'w-28',
  discount: 'w-20',
  unit: 'w-24',
  price: 'w-32',
  taxPercent: 'w-20',
  taxAmount: 'w-28',
  amount: 'w-36',
}
