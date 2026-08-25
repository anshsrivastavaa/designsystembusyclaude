// The cell while it is being typed in.
//
// It holds the TEXT the user has typed, not the number the store holds, and that is not a
// nicety. Half of what someone types on the way to a number is not a number: "12." on the
// way to 12.50, "-" on the way to -4. Pushing every keystroke through the store and reading
// it back destroys those, so a price with a decimal point could not be typed at all and a
// negative quantity was impossible. The store still gets every keystroke — it is the display
// that comes from the draft.

import { useEffect, useRef, useState, type Ref } from 'react'

import { TextField } from '@busy/ui/TextField'
import type { ColumnId } from '../../lib/keyboard'
import type { InvoiceRow } from '../../data/schema/invoice'
import { alignmentOf } from './cellContent'
import { acceptsTyped } from './moneyShorthand'

type EditableCellProps = {
  ref: Ref<HTMLInputElement>
  column: ColumnId
  row: InvoiceRow
  index: number
  invalid: boolean
  /** Typing into this cell. ONE CALLBACK: six with identical signatures were dispatched by an
   * if/else on the column this component is already holding, so the column goes with the value
   * and the store decides what it means. */
  onType: (column: ColumnId, index: number, typed: string) => void
}

function startingText(row: InvoiceRow, column: ColumnId): string {
  if (column === 'quantity') return row.quantity === 0 ? '' : String(row.quantity)
  // TWO DECIMALS, the same as every read-only cell. String(1250 / 100) is "12.5", so the column
  // changed format under the cursor: 12.50 at rest and 12.5 while you were in it.
  if (column === 'price') return row.pricePaise === 0 ? '' : (row.pricePaise / 100).toFixed(2)
  if (column === 'amount') return row.amountPaise === 0 ? '' : (row.amountPaise / 100).toFixed(2)
  if (column === 'discount') return row.discountPercent === 0 ? '' : String(row.discountPercent)
  if (column === 'freeQuantity') return row.freeQuantity === 0 ? '' : String(row.freeQuantity)
  return row.unit
}

export function EditableCell({ ref, column, row, index, invalid, onType }: EditableCellProps) {
  const [draft, setDraft] = useState(() => startingText(row, column))
  const wasRow = useRef(row.id)

  // Arriving at a different row means a different value, so the draft restarts. Arriving back
  // at the same cell keeps what is there.
  useEffect(() => {
    if (wasRow.current !== row.id) {
      wasRow.current = row.id
      setDraft(startingText(row, column))
    }
  }, [row, column])

  return (
    <TextField
      ref={ref}
      aria-label={column}
      align={alignmentOf(column)}
      invalid={invalid}
      value={draft}
      onChange={(event) => {
        const typed = event.target.value
        // REFUSED AS IT IS TYPED, NOT ON BLUR. The draft is simply not moved, so the wrong key
        // does nothing and the cell never shows a character it is not going to keep. A cell that
        // accepts a letter, shows it, and quietly drops it later has already lied about what it
        // holds — and this grid has the scar: `5k` was accepted, shown, and stored as zero.
        if (!acceptsTyped(column, typed)) return
        setDraft(typed)
        onType(column, index, typed)
      }}
    />
  )
}
