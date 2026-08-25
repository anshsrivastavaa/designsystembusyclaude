// The row that closes the table.
//
// v2 ends its grid with one and ours ended with a border, which is why the two looked different
// at a glance even when the rows matched: an open-ended table reads as a list that got cut off
// rather than a table that is finished.
//
// Empty, it says so in words. Filled, it carries the line count and the totals of the columns
// that actually add up — a total under "Unit", or a sum of tax RATES, is arithmetic nobody
// asked for and reads as a number that means something.
//
// THE COUNT LIVES HERE AND NOWHERE ELSE. "1 line" beside Save is gone: a count belongs to the
// table it counts, not to the button that saves the invoice.

import type * as React from 'react'

import type { ColumnId } from '../../lib/keyboard'
import { WIDTHS } from './gridColumns'

const alignsRight = (column: ColumnId) => column !== 'item' && column !== 'unit' && column !== 'serial'

function summaryOf(column: ColumnId, lines: number, totalOf: (column: ColumnId) => string) {
  if (column === 'item') return lines === 0 ? 'No lines yet' : `${lines} ${lines === 1 ? 'line' : 'lines'}`
  if (column === 'quantity' || column === 'amount' || column === 'taxAmount') return totalOf(column)
  return ''
}

export type GridSummaryProps = {
  columns: readonly ColumnId[]
  /** Width and freeze for each column, worked out once by the grid. */
  styleOf: Record<string, React.CSSProperties>
  /** The columns inside the frozen block. */
  frozen: readonly string[]
  /** The one column in each block that draws the edge line. */
  edges: { start: ColumnId | null; end: ColumnId | null }
  /** Somebody has dragged an edge, so the columns are pixels and the grow weights come off. */
  fitted: boolean
  lines: number
  totalOf: (column: ColumnId) => string
}

export function GridSummary({ columns, styleOf, frozen, edges, fitted, lines, totalOf }: GridSummaryProps) {
  return (
    <div
      role="row"
      className={`flex h-row shrink-0 items-stretch rounded-b-card border-t border-stroke bg-surface-sunken ${
        fitted ? 'w-max min-w-full' : ''
      }`}
    >
      {columns.map((column) => (
        <div
          key={column}
          role="gridcell"
          style={styleOf[column] ?? {}}
          // A frozen cell in this row needs the row's own fill as well, or the totals break in
          // half as the grid travels sideways — the same reason a frozen body cell carries the
          // cursor tint.
          className={`flex h-full items-center border-r px-2 text-sm text-ink-secondary last:border-r-0 ${
            column === edges.start ? 'border-stroke-strong' : 'border-stroke'
          } ${column === edges.end ? 'border-l border-l-stroke-strong' : ''} ${
            frozen.includes(column) ? 'bg-surface-sunken' : ''
          } ${fitted ? '' : WIDTHS[column]} ${
            alignsRight(column) ? 'justify-end' : ''
          }`}
        >
          {summaryOf(column, lines, totalOf)}
        </div>
      ))}
    </div>
  )
}
