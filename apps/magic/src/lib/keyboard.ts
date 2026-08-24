// Where the cursor goes next. Pure: no React, no DOM, no store — so the grid's keyboard walk
// can be tested without a browser and mutated without a screen.
//
// Enter and the arrow keys are deliberately different journeys. Enter is the typing journey:
// it visits only the three fields a person actually fills in, then drops to the next row.
// Arrows are the inspection journey: they reach every cell, including the ones worked out
// for you, because you still need to read them.

/** Every column that can appear, in no particular order — the ORDER is decided per tax mode
 * by columnsFor() below, because two of these move from one side of Amount to the other. */
export const COLUMNS = [
  'serial',
  'item',
  'alias',
  'hsn',
  'quantity',
  'freeQuantity',
  'unit',
  'mrp',
  'price',
  'discount',
  'taxPercent',
  'taxAmount',
  'amount',
] as const
export type ColumnId = (typeof COLUMNS)[number]

/** Which columns this invoice shows, and in which order.
 *
 * THE TAX COLUMNS CHANGE SIDES, and that is the whole of how the three modes differ on the
 * grid. Prices EXCLUDING tax put Tax % and Tax Amount BEFORE Amount, because Amount is what
 * they add up to. Prices INCLUDING tax put them AFTER, because Amount already contains them
 * and a column after a total reads as a breakdown of it rather than a step towards it. Bill
 * -wise mode has no tax columns at all — tax arrives as generated charges instead.
 *
 * The order here is the order on the screen, the order the arrow keys walk, and the order Tab
 * follows. One list, so those three can never disagree. */
export type ColumnSwitches = {
  discount?: boolean
  alias?: boolean
  hsn?: boolean
  mrp?: boolean
  freeQuantity?: boolean
}

export function columnsFor(
  mode: 'itemExclusive' | 'itemInclusive' | 'billWise',
  extras: ColumnSwitches = {},
): readonly ColumnId[] {
  // The default set the product document names, in its order: S.No., Item, Qty, Unit, Price,
  // Discount, Tax %, Tax Amount, Amount. The optional ones sit where they belong rather than
  // being appended — an alias belongs beside the name it is an alias for, and a free quantity
  // beside the quantity it is free ON.
  const before: ColumnId[] = ['serial', 'item']
  if (extras.alias === true) before.push('alias')
  if (extras.hsn === true) before.push('hsn')
  before.push('quantity')
  if (extras.freeQuantity === true) before.push('freeQuantity')
  before.push('unit')
  if (extras.mrp === true) before.push('mrp')
  before.push('price')
  if (extras.discount === true) before.push('discount')

  if (mode === 'billWise') return [...before, 'amount']
  // Excluding tax the tax columns come BEFORE the amount they add up to; including it they come
  // after, because the amount already contains them.
  if (mode === 'itemExclusive') return [...before, 'taxPercent', 'taxAmount', 'amount']
  return [...before, 'amount', 'taxPercent', 'taxAmount']
}

/** The three the user types into. Enter walks these and nothing else. */
const TYPING_WALK: readonly ColumnId[] = ['item', 'quantity', 'price']

export type Cursor = { row: number; column: ColumnId }

export function isEditable(column: ColumnId): boolean {
  if (column === 'discount' || column === 'freeQuantity') return true
  // AMOUNT IS TYPED INTO, and that is a change from the first build. An operator who has been
  // given a figure — "make it two thousand" — should not have to divide it by the quantity in
  // their head to find the price. Typing the amount works the price backwards; see the store.
  return column === 'item' || column === 'quantity' || column === 'unit' || column === 'price' || column === 'amount'
}

/** Enter: on through the typing walk, then the item cell of the row below. */
export function onEnter(cursor: Cursor, rowCount: number): Cursor {
  const at = TYPING_WALK.indexOf(cursor.column)
  const next = TYPING_WALK[at + 1]
  if (at !== -1 && next) return { row: cursor.row, column: next }

  const row = Math.min(cursor.row + 1, rowCount - 1)
  return { row, column: 'item' }
}

/** True when Enter on this cell would need a row that does not exist yet.
 *
 * Any cell that Enter does not carry on through within its own row drops to the row below —
 * the end of the typing walk, and equally a column the walk never visits, like Unit. On the
 * last row all of those need somewhere to land, and Unit did not get one: the cursor moved
 * to a row that had never been created and the keyboard went with it. */
export function enterNeedsNewRow(cursor: Cursor, rowCount: number): boolean {
  const at = TYPING_WALK.indexOf(cursor.column)
  const carriesOnInThisRow = at !== -1 && at < TYPING_WALK.length - 1
  return !carriesOnInThisRow && cursor.row === rowCount - 1
}

export type Direction = 'left' | 'right' | 'up' | 'down'

/** One cell in a direction, stopping at the edges rather than wrapping.
 *
 * It takes a DIRECTION, not a key. Which key means which direction is decided in one table,
 * in lib/shortcuts.ts, and this file has no opinion about keyboards at all. */
export function onArrow(
  cursor: Cursor,
  direction: Direction,
  rowCount: number,
  // The DEFAULT SET, not every column that can exist. COLUMNS is the vocabulary; a screen only
  // ever walks the columns it is actually showing, and defaulting to the vocabulary made the
  // walk stop at columns nobody had switched on.
  columns: readonly ColumnId[] = columnsFor('itemExclusive'),
): Cursor {
  const column = columns.indexOf(cursor.column)

  if (direction === 'right') return { ...cursor, column: columns[Math.min(column + 1, columns.length - 1)]! }
  if (direction === 'left') return { ...cursor, column: columns[Math.max(column - 1, 0)]! }
  if (direction === 'down') return { ...cursor, row: Math.min(cursor.row + 1, rowCount - 1) }
  return { ...cursor, row: Math.max(cursor.row - 1, 0) }
}

/** Tab: the editable fields of this row, then out of the grid entirely.
 *
 * Unit leaves the tab order once the row's unit is settled — an item that arrived with its
 * unit does not need to be asked about it on the way past. A row with no item yet does, so it
 * keeps its stop. The arrow keys are unaffected and always reach Unit, because a cell you are
 * not typing into is still a cell you may need to stand on and read. */
export function onTab(
  cursor: Cursor,
  backwards: boolean,
  unitSettled = false,
  columns: readonly ColumnId[] = columnsFor('itemExclusive'),
): Cursor | 'leave' {
  const editable = columns.filter(isEditable).filter((column) => !(column === 'unit' && unitSettled))
  const at = editable.indexOf(cursor.column)
  const next = editable[backwards ? at - 1 : at + 1]
  if (at === -1 || !next) return 'leave'
  return { row: cursor.row, column: next }
}

/** The last row that actually holds an item. The grid pads itself with empty rows, so the
 * last row on screen is almost never the last row of the invoice. */
export function lastFilledRow(filled: readonly boolean[]): number {
  for (let index = filled.length - 1; index >= 0; index -= 1) {
    if (filled[index] === true) return index
  }
  return 0
}
