// What typing does to a row.
//
// OUT OF store.ts, which crossed the 250-line cap when Hold arrived. The cap was right about which
// half had grown: the rest of that file is the invoice as a WHOLE — who it is for, what state it
// is in, what has been received — and this is the three actions that change one line of it, plus
// the one helper that keeps a memoised row from re-rendering because its neighbour did.

import { lineAmount, toPaise } from '../../lib/money'
import { expandShorthand } from './moneyShorthand'
import type { ColumnId } from '../../lib/keyboard'
import type { InvoiceRow } from '../../data/schema/invoice'
import type { Item } from '../../data/schema/item'
import type { ItemFacts } from './cellHands'
import type { SplitPart } from './splitSchedule'
import { TYPED_INTO } from './typedInto'

export type RowWrites = {
  /** Picking an item fills unit, tax and price, and quantity defaults to 1 — or to 0 for an
   * item sold loose, which has no unit at all. */
  applyItem: (rowIndex: number, item: Item) => void
  /** Typing into any editable column. ONE ACTION, because six with identical signatures were
   * six callbacks threaded through seven files to reach an if/else that already knew the
   * column. What each column changes is the table in typedInto.ts. */
  setCell: (column: ColumnId, rowIndex: number, typed: string) => void
  /** Type the amount, and the PRICE moves to match. */
  setItemText: (rowIndex: number, text: string) => void
}

type State = {
  rows: InvoiceRow[]
  itemFacts: Record<string, ItemFacts>
  /** A SPLIT INVOICE REFUSES NEW LINES (ruled). Its parts are amounts somebody agreed against a
   * total, and a line added afterwards changes that total under them — so the invoice says no and
   * names the way out rather than silently re-spreading a schedule that was hand-made. */
  splitParts: readonly SplitPart[]
  asking: { field: 'party' | 'item'; message: string } | null
}
type Apply = (change: Partial<State> | ((state: State) => Partial<State>)) => void

function replace(rows: InvoiceRow[], index: number, change: Partial<InvoiceRow>): InvoiceRow[] {
  const row = rows[index]
  if (!row) return rows
  const next = { ...row, ...change }
  next.amountPaise = lineAmount(next.quantity, next.pricePaise, next.discountPercent)
  // A new array for the list, the same object for every row that did not change, so a
  // memoised row does not re-render because its neighbour did.
  const copy = rows.slice()
  copy[index] = next
  return copy
}

export function rowWrites(set: Apply): RowWrites {
  return {
    applyItem: (rowIndex, item) =>
      set((state) => {
        // The refusal lands on the ITEM, which is the thing being added, and carries the way out
        // in the same sentence. Errors say what to correct, on the thing being corrected.
        if (state.splitParts.length > 1) {
          return { asking: { field: 'item' as const, message: 'Remove the split to change this invoice.' } }
        }
        return ({
        itemFacts: {
          ...state.itemFacts,
          [item.id]: {
            stock: item.stock,
            hsn: item.hsn,
            alias: item.alias,
            lastRatePaise: item.lastRatePaise,
            listRatePaise: item.listRatePaise,
            mrpPaise: item.mrpPaise,
          },
        },
        rows: replace(state.rows, rowIndex, {
          itemId: item.id,
          itemName: item.name,
          unit: item.defaultUnit ?? '',
          pricePaise: item.pricePaise,
          taxPercent: item.taxPercent,
          // The treatment and the cess travel with the item onto the row, because a return
          // groups by them and an invoice records what was sold under which treatment that day.
          taxTreatment: item.taxTreatment,
          cessPercent: item.cessPercent,
          costPaise: item.costPaise,
          quantity: item.units.length > 0 ? 1 : 0,
        }),
        })
      }),

    setItemText: (rowIndex, text) => set((state) => ({ rows: replace(state.rows, rowIndex, { itemName: text }) })),
    setCell: (column, rowIndex, typed) =>
      set((state) => {
        // TYPING THE AMOUNT WORKS THE PRICE BACKWARDS, in the basis the column is in — the same
        // division either way, precisely because the column and the price always share a basis.
        //
        // The PRICE carries the rounding, and the amount is re-derived from it: three at 100.00
        // gives 33.33 each and an amount of 99.99, because an amount that is not quantity times
        // price is a line nobody can check. It is the one column that does not write its own
        // field, which is why it is here and not in the table.
        if (column === 'amount') {
          const row = state.rows[rowIndex]
          if (!row) return {}
          // Nothing to work backwards from. Leave the price alone rather than dividing by nothing.
          if (row.quantity === 0) return {}
          return { rows: replace(state.rows, rowIndex, { pricePaise: Math.round(toPaise(expandShorthand(typed)) / row.quantity) }) }
        }

        const change = TYPED_INTO[column]
        if (change === undefined) return {}
        return { rows: replace(state.rows, rowIndex, change(typed)) }
      }),
  }
}
