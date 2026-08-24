// The invoice being edited. Client state until it is saved — that is the one place the
// server/client line blurs, so it is written down here.

import { create } from 'zustand'

import { lineAmount, toPaise } from '../../lib/money'
import type { ColumnId, Cursor } from '../../lib/keyboard'
import { emptyRow, type InvoiceRow } from '../../data/schema/invoice'
import type { InvoiceSettings } from '../../data/schema/settings'
import { sundryActions, type SundryActions } from './sundryActions'
import { noteAndRights, type NoteAndRights } from './noteAndRights'
import type { ItemFacts } from './cellHands'
import { particulars, type Particulars } from './particulars'
import { TYPED_INTO } from './typedInto'
import { selection, type Selection } from './selection'
import type { Item } from '../../data/schema/item'
import type { Party } from '../../data/schema/party'


/** What the screen is waiting for the person to correct, and where to put the cursor. Held in
 * the store because the button that finds the problem and the field showing it are apart. */
export type Asking = { field: 'party' | 'item'; message: string }

/** What the screen assumes until the adapter answers: a shape to render while the real settings
 * are in flight, replaced whole the moment they land. Not a decision. */
const UNTIL_SETTINGS_ARRIVE: InvoiceSettings = {
  taxMode: 'itemExclusive',
  roundOff: { stepPaise: 100, method: 'nearest', on: true },
  columns: { discount: false, alias: false, hsn: false, mrp: false, freeQuantity: false },
  roundEachLine: false,
  hsnWiseSummary: false,
  companyStateCode: '23',
}

type InvoiceState = SundryActions & NoteAndRights & Particulars & Selection & {
  /** Columns this user may look at and not change. It comes from their rights, so it is the same
   * all day — drawn as shape, never a tint: an exception that never ends is not an exception. */
  readOnlyColumns: readonly ColumnId[]
  party: Party | null
  asking: Asking | null
  /** False until somebody has put the keyboard in the grid. An invoice begins at the party
   * field, so the grid does not take focus on load and moves the keyboard only once given it. */
  gridEngaged: boolean
  rows: InvoiceRow[]
  /** How this company bills. Read once when the screen opens; nothing writes it back. */
  settings: InvoiceSettings
  /** What the item strip knows about each item on this invoice, by item id. Kept beside the
   * rows rather than on them: stock and a price list change under you, and a row records what
   * was SOLD rather than what the catalogue says today. */
  itemFacts: Record<string, ItemFacts>
  cursor: Cursor
  /** Bumped every time somebody PLACES the cursor, even onto the cell it is already on. The
   * position alone does not mean "put the keyboard here": picking a party hands it to the
   * first item cell, and when the cursor was already there nothing about the position changed,
   * so the keyboard stayed in the party field. This is the claim, separate from the place. */
  cursorClaim: number
  chooseParty: (party: Party) => void
  askFor: (field: Asking['field'], message: string) => void
  answered: () => void
  load: (rows: InvoiceRow[], paidPaise?: number) => void
  /** Start a new invoice. Everything the last one held goes.
   *
   * The store outlives the screen, so a second mount found the first invoice still in it —
   * party, lines, charges and note. Nothing cleared it unless `?rows=N` was on the address,
   * which nobody types: pressing New gave you the last customer's invoice with their name on
   * it, which is the first thing anybody clicking around meets. */
  reset: () => void
  loadSettings: (settings: InvoiceSettings) => void
  /** Whether THIS invoice rounds. The step and the method are the company's and stay put.
   *
   * IT LIVES ON THE INVOICE, NOT IN THE SETTINGS. It was written into the settings copy the
   * screen holds, and the settings drawer pushes that copy back in whenever ANY setting
   * changes — so unticking round off and then touching an unrelated switch put the round off
   * back, and the grand total moved with nobody having touched it. A money figure that changes
   * by itself is the worst thing a screen can do. */
  roundOffOn: boolean
  /** Has anybody moved the control on this invoice. Until they have, the company's default
   * follows a settings change; afterwards it does not. */
  roundOffTouched: boolean
  setRoundOff: (on: boolean) => void
  moveTo: (cursor: Cursor) => void
  engageGrid: () => void
  appendRow: () => void
  removeRow: (index: number) => void
  /** Keep at least this many rows, padding with empty ones. The grid fills its visible
   * height and always keeps one row beyond the cursor — the spreadsheet behaviour these
   * users already know, and what closes the empty space under a short invoice. */
  keepRoomFor: (rows: number) => void
  /** Picking an item fills unit, tax and price, and quantity defaults to 1 — or to 0 for an
   * item sold loose, which has no unit at all. */
  applyItem: (rowIndex: number, item: Item) => void
  /** Typing into any editable column. ONE ACTION, because six with identical signatures were
   * six callbacks threaded through seven files to reach an if/else that already knew the
   * column. What each column changes is the table below. */
  setCell: (column: ColumnId, rowIndex: number, typed: string) => void
  /** Type the amount, and the PRICE moves to match. */
  setItemText: (rowIndex: number, text: string) => void
}


function replace(rows: InvoiceRow[], index: number, change: Partial<InvoiceRow>): InvoiceRow[] {
  const row = rows[index]
  if (!row) return rows
  const next = { ...row, ...change }
  next.amountPaise = lineAmount(next.quantity, next.pricePaise)
  // A new array for the list, the same object for every row that did not change, so a
  // memoised row does not re-render because its neighbour did.
  const copy = rows.slice()
  copy[index] = next
  return copy
}

export const useInvoice = create<InvoiceState>((set) => ({
  // `?readonly=price` for looking at it. It arrives with the user's rights from the backend
  // — see docs/backend-assumptions.md.
  readOnlyColumns: (typeof window === 'undefined'
    ? []
    : (new URLSearchParams(window.location.search).get('readonly') ?? '')
        .split(',')
        .filter(Boolean)) as ColumnId[],
  party: null,
  asking: null,
  gridEngaged: false,
  rows: [emptyRow('row-0')],
  settings: UNTIL_SETTINGS_ARRIVE,
  cursor: { row: 0, column: 'item' },
  cursorClaim: 0,
  roundOffOn: true,
  roundOffTouched: false,
  itemFacts: {},
  // PRINTED IS THE DEFAULT. A note nobody outside can see is the special case, and the
  // commonest narration is a delivery instruction or a reference the customer needs.

  chooseParty: (party) => set({ party, asking: null }),
  askFor: (field, message) => set({ asking: { field, message } }),
  answered: () => set({ asking: null }),
  reset: () =>
    set((state) => ({
      party: null,
      asking: null,
      gridEngaged: false,
      rows: [emptyRow('row-0')],
      cursor: { row: 0, column: 'item' },
      cursorClaim: state.cursorClaim + 1,
      itemFacts: {},
      roundOffTouched: false,
      roundOffOn: state.settings.roundOff.on,
      // The charges, the note and the header go back to what a fresh invoice opens with —
      // including the date, which is today rather than the day the tab was opened.
      ...sundryActions(set),
      ...noteAndRights(set),
      ...particulars(set),
      ...selection(set),
    })),

  load: (rows, paidPaise = 0) =>
    set((state) => ({ rows, paidPaise, cursor: { row: 0, column: 'item' }, cursorClaim: state.cursorClaim + 1 })),
  // The company's answer arrives here, carrying whether round off is ON BY DEFAULT. It seeds
  // this invoice only while nobody has touched the control — after that the invoice owns it,
  // and a later settings change may not reach in and move the total.
  loadSettings: (settings) =>
    set((state) => ({ settings, roundOffOn: state.roundOffTouched ? state.roundOffOn : settings.roundOff.on })),
  ...sundryActions(set),
  ...noteAndRights(set),
  ...particulars(set),
  ...selection(set),

  setRoundOff: (roundOffOn) => set({ roundOffOn, roundOffTouched: true }),
  moveTo: (cursor) => set((state) => ({ cursor, gridEngaged: true, cursorClaim: state.cursorClaim + 1 })),
  engageGrid: () => set({ gridEngaged: true }),

  appendRow: () =>
    set((state) => ({
      rows: [...state.rows, emptyRow(`row-${state.rows.length}-${Date.now()}`)],
    })),

  removeRow: (index) =>
    set((state) => ({ rows: state.rows.filter((_, at) => at !== index) })),

  keepRoomFor: (wanted) =>
    set((state) => {
      if (state.rows.length >= wanted) return state
      const padded = state.rows.slice()
      while (padded.length < wanted) padded.push(emptyRow(`row-pad-${padded.length}`))
      return { rows: padded }
    }),

  applyItem: (rowIndex, item) =>
    set((state) => ({
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
    })),

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
        return { rows: replace(state.rows, rowIndex, { pricePaise: Math.round(toPaise(typed) / row.quantity) }) }
      }

      const change = TYPED_INTO[column]
      if (change === undefined) return {}
      return { rows: replace(state.rows, rowIndex, change(typed)) }
    }),
}))
