// The invoice being edited. Client state until it is saved — that is the one place the
// server/client line blurs, so it is written down here.

import { create } from 'zustand'

import type { ColumnId, Cursor } from '../../lib/keyboard'
import { emptyRow, type InvoiceDraft, type InvoiceRow } from '../../data/schema/invoice'
import type { InvoiceSettings } from '../../data/schema/settings'
import { sundryActions, type SundryActions } from './sundryActions'
import { noteAndRights, type NoteAndRights } from './noteAndRights'
import type { ItemFacts } from './cellHands'
import { particulars, type Particulars } from './particulars'
import { selection, type Selection } from './selection'
import { attaching, type Attaching } from './attaching'
import { settling, type Settling } from './settling'
import { transport, type Transport } from './transport'
import { splitting, type Splitting } from './splitting'
import { rowWrites, type RowWrites } from './rowWrites'
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

type InvoiceState = SundryActions & NoteAndRights & Particulars & Selection & Attaching & Settling & Transport & RowWrites & Splitting & {
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
  /** Put a held invoice back on the screen, whole.
   *
   * IT GOES THROUGH `reset` FIRST, on purpose. Restoring by writing the held fields over whatever
   * is there leaves anything the held invoice does NOT carry behind — a charge on the invoice you
   * were halfway through would survive into the one you brought back, and the operator would have
   * no way of knowing where it came from. What is restored is the whole invoice or none of it. */
  restore: (draft: InvoiceDraft, party: Party) => void
  /** What the item strip knows, for an invoice that was OPENED rather than typed. The rows carry
   * no stock, no HSN and no history — those are the item master's — so they are fetched once for
   * the whole invoice and dropped in here. See `itemsByIds` on the adapter. */
  fillItemFacts: (items: readonly Item[]) => void
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
}


export const useInvoice = create<InvoiceState>((set) => {
  /** A fresh invoice, as a set of changes. Shared by `reset` and by `restore`, because "start
   * again" and "start again holding this" differ only in what gets written on top. */
  const blank = (state: InvoiceState): Partial<InvoiceState> => ({
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
    ...attaching(set),
    ...settling(set),
    ...transport(set),
    ...splitting(set),
  })

  return {
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
  reset: () => set(blank),

  // THE WHOLE INVOICE OR NONE OF IT. Restoring by writing the held fields over whatever is on the
  // screen leaves behind anything the held one does not carry — a charge from the invoice you were
  // halfway through would survive into the one you brought back, and nothing would say where it
  // came from. So it goes through blank first, every time.
  restore: (draft, party) =>
    set((state) => ({
      ...blank(state),
      party,
      rows: draft.rows.length > 0 ? draft.rows : [emptyRow('row-0')],
      narration: draft.narration,
      narrationPrinted: draft.narrationPrinted,
      roundOffOn: draft.roundOffOn,
      sundries: draft.sundries,
      attachments: draft.attachments,
      eInvoice: draft.eInvoiceStatus !== 'notRequired',
      eWayBill: draft.eWayBillStatus !== 'notRequired',
      cursorClaim: state.cursorClaim + 1,
    })),

  fillItemFacts: (items) =>
    set((state) => ({
      itemFacts: {
        ...state.itemFacts,
        // WHAT IS ALREADY THERE WINS. A line whose item was picked in this session has facts that
        // were true at the moment of picking, and a later fetch must not quietly replace them
        // with today's stock — a row records what was SOLD, not what the catalogue says now.
        ...Object.fromEntries(
          items
            .filter((item) => state.itemFacts[item.id] === undefined)
            .map((item) => [
              item.id,
              {
                stock: item.stock,
                hsn: item.hsn,
                alias: item.alias,
                lastRatePaise: item.lastRatePaise,
                listRatePaise: item.listRatePaise,
                mrpPaise: item.mrpPaise,
              },
            ]),
        ),
      },
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
  ...attaching(set),
  ...settling(set),
  ...transport(set),
  ...splitting(set),

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

  ...rowWrites(set),
  }
})
