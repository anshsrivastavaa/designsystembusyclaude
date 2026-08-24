// One row of the item grid, memoised. This is the line that makes the plain build viable at
// two thousand rows: a keystroke re-renders the row you are typing in and the row you left,
// and nothing else.
//
// Row states, one channel each, so no two ever compete for the same pixels:
//   the row background   the row the cursor is on, and the row under the pointer
//   an inset ring        keyboard focus, on the cell
//   the cell fill        invalid — on the CELL, so the screen says which field is wrong
//   a sunken cell        locked, with no text cursor and the value still readable

import { memo } from 'react'

import type { ColumnId } from '../../lib/keyboard'
import type { InvoiceRow } from '../../data/schema/invoice'
import { Icon } from '@busy/ui/Icon'
import { Cell } from './Cell'
import type { CellHands, ItemFacts } from './cellHands'
import { DeleteRow } from './DeleteRow'

export type ItemRowProps = {
  /** The columns this invoice shows, in order — decided by the tax mode, in one place. */
  columns: readonly ColumnId[]
  widths: Record<ColumnId, string>
  /** Gathered once by the grid and handed down. A row that reads the store itself is two
   * thousand subscriptions; a cell that does is twenty thousand. */
  hands: CellHands
  facts: ItemFacts | undefined
  gridEngaged: boolean
  cursorClaim: number
  row: InvoiceRow
  index: number
  cursorColumn: ColumnId | null
  invalidColumn: ColumnId | null
  /** Picked for deleting. A boolean, so `memo` still holds for every row but the one that
   * changed. */
  selected: boolean
}

function ItemRowInner({ row, index, cursorColumn, invalidColumn, columns, widths, hands, facts, gridEngaged, cursorClaim, selected }: ItemRowProps) {
  const onCursorRow = cursorColumn !== null

  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      aria-selected={selected || undefined}
      data-cursor-row={onCursorRow || undefined}
      // THE CURSOR ROW ALONE OWNS THE BACKGROUND. Hover does not tint: it already has a
      // signal, which is that the row actions appear on it. Tinting as well meant two rows
      // read as current at once whenever the pointer rested away from the cursor — which is
      // the thing Aj kept seeing and could not name.
      className={`group flex h-row items-stretch border-b border-stroke ${
        onCursorRow ? 'bg-surface-hover' : ''
      }`}
    >
      {columns.map((column) =>
        column === 'serial' ? (
          // The gutter. The row number at rest, the delete control on the row you are on. The
          // overlay takes no pointer events, so the cell underneath still takes a click and the
          // keyboard still walks through the serial column.
          <span key={column} className="relative flex">
            <Cell column={column} row={row} index={index} cursor={cursorColumn} invalid={invalidColumn} width={widths[column]} onCursorRow={onCursorRow} hands={hands} facts={facts} gridEngaged={gridEngaged} cursorClaim={cursorClaim} selected={selected} />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* THE TICK REPLACES THE ROW NUMBER, it does not sit beside it. One slot holds one
                  thing at a time — the same rule the delete control follows — and a tick that
                  took its own width would move every number on the invoice sideways the first
                  time anything was picked. */}
              {selected ? (
                <Icon name="tick" className="size-icon-sm text-ink-accent" />
              ) : (
                <span className="pointer-events-auto">
                  <DeleteRow index={index} filled={row.itemId !== null} onCursorRow={onCursorRow} />
                </span>
              )}
            </span>
          </span>
        ) : (
          <Cell key={column} column={column} row={row} index={index} cursor={cursorColumn} invalid={invalidColumn} width={widths[column]} onCursorRow={onCursorRow} hands={hands} facts={facts} gridEngaged={gridEngaged} cursorClaim={cursorClaim} selected={selected} />
        ),
      )}
    </div>
  )
}

export const ItemRow = memo(ItemRowInner)
