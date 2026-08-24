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

import type { ColumnId } from '../../lib/keyboard'

const alignsRight = (column: ColumnId) => column !== 'item' && column !== 'unit' && column !== 'serial'

function summaryOf(column: ColumnId, lines: number, totalOf: (column: ColumnId) => string) {
  if (column === 'item') return lines === 0 ? 'No lines yet' : `${lines} ${lines === 1 ? 'line' : 'lines'}`
  if (column === 'quantity' || column === 'amount' || column === 'taxAmount') return totalOf(column)
  return ''
}

export type GridSummaryProps = {
  columns: readonly ColumnId[]
  widths: Record<ColumnId, string>
  lines: number
  totalOf: (column: ColumnId) => string
}

export function GridSummary({ columns, widths, lines, totalOf }: GridSummaryProps) {
  return (
    <div role="row" className="flex h-row shrink-0 items-stretch rounded-b-card border-t border-stroke bg-surface-sunken">
      {columns.map((column) => (
        <div
          key={column}
          role="gridcell"
          className={`flex h-full items-center border-r border-stroke px-2 text-sm text-ink-secondary last:border-r-0 ${widths[column]} ${
            alignsRight(column) ? 'justify-end' : ''
          }`}
        >
          {summaryOf(column, lines, totalOf)}
        </div>
      ))}
    </div>
  )
}
