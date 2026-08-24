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

/** HOW WIDE EACH COLUMN SITS, AND WHY ITEM NAME IS NOT A NUMBER IN THIS TABLE.
 *
 * MEASURED, BOTH BUILDS, AT 1440. v2 draws Item Name at 307 in a grid 1412 wide. Ours drew it
 * at 470 in a grid 1352 wide — and the 163 of difference was not a decision anybody made about
 * item names. Every OTHER column here was narrower than v2's: Qty 96 against 138, Price 128
 * against 169, Tax Amount 112 against 154, Amount 144 against 184. Item Name is the one column
 * that flexes, so every pixel the others did not take, it took.
 *
 * SO THE FIX IS THE OTHER NINE, NOT THIS ONE. Widening the columns toward what v2 gives them
 * leaves Item Name at 302 at 1440 without a number being written for it — five pixels off v2,
 * arrived at the way v2 arrives at it. Writing 307 here instead would have been worse than
 * useless: the grid has to fill its width at every window size, so something must take up the
 * slack, and a grid of ten fixed columns ends in a ragged strip of nothing at the right edge.
 *
 * AND EVERY COLUMN SHARES THE SLACK, WHICH IS THE OTHER HALF AND THE HALF THAT WAS MISSING.
 * Item Name alone flexed, so it alone absorbed a wider window: at 1920 it measured 782 while
 * every other column stayed where it was — the same fault this table was fixing, moved along
 * to the window size most people actually have. Each column now carries a GROW WEIGHT equal to
 * its own width, so free space is shared in proportion and the ratios hold at any size. That
 * is v2's percentage colgroup, written as flex, which is what this grid is made of.
 *
 * SHRINKING NEEDED NOTHING WRITTEN. Flexbox already shrinks in proportion to a column's own
 * basis, so a narrow window takes from the wide columns first, which is the same rule read
 * backwards. */
export const WIDTHS: Record<ColumnId, string> = {
  // MEASURED OFF v2, not derived: 46px there against 56 here, for a column that holds a
  // two-digit number beside a 34px row. w-12 is 48 and is the nearest stop on the scale.
  // IT IS THE ONE COLUMN THAT DOES NOT GROW. A row number is two digits at any window size.
  serial: 'w-12 shrink-0 grow-0',
  // MIN-W SO IT CANNOT BE CRUSHED. A narrow window takes most from the widest column, and an
  // Item Name column narrower than the words in it is the one that can afford it least.
  item: 'min-w-48 basis-76 grow-76',
  alias: 'basis-24 grow-24',
  hsn: 'basis-24 grow-24',
  quantity: 'basis-32 grow-32',
  freeQuantity: 'basis-24 grow-24',
  mrp: 'basis-32 grow-32',
  discount: 'basis-24 grow-24',
  unit: 'basis-26 grow-26',
  price: 'basis-40 grow-40',
  taxPercent: 'basis-24 grow-24',
  taxAmount: 'basis-36 grow-36',
  amount: 'basis-44 grow-44',
}
