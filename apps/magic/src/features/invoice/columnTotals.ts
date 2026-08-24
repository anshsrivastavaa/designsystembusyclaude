// What the row closing the item grid puts under each column.
//
// Its own file because the grid was over its line again and this is genuinely a separate thing:
// the grid draws a table, this adds one up. It is also the only part of the summary row worth
// testing, which is much easier when it does not need a grid around it.

import { formatPaise } from '../../lib/money'
import type { ColumnId } from '../../lib/keyboard'
import type { InvoiceRow } from '../../data/schema/invoice'
import { taxOnRow } from './cellContent'

export function columnTotals(rows: readonly InvoiceRow[]) {
  const filled = rows.filter((row) => row.itemId !== null)
  const lines = filled.length

  const totalOf = (column: ColumnId): string => {
    if (lines === 0) return ''

    if (column === 'quantity') {
      // BLANK WHEN THE UNITS DISAGREE. Adding pieces to kilograms gives a number that is not
      // about anything, and a total nobody can name is worse than no total at all.
      const units = new Set(filled.map((row) => row.unit))
      if (units.size > 1) return ''
      return String(filled.reduce((running, row) => running + row.quantity, 0))
    }

    const paise = filled.reduce((running, row) => running + (column === 'amount' ? row.amountPaise : taxOnRow(row)), 0)
    return formatPaise(paise)
  }

  return { lines, totalOf }
}
