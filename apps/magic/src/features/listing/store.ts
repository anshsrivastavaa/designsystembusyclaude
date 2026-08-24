// Everything the listing is currently showing. One store, because seven controls narrow the
// same list and each of them has to see what the others have done — the chips row prints what
// the popovers set, and the tab counts are taken after every one of them.
//
// THE TWO DOORS TO COMPLIANCE ARE ONE PIECE OF STATE. The toolbar checkbox is for the person
// who does this every morning; the one inside the filter popover is for somebody already in
// there filtering. They are deliberately two doors to the same room, so they read and write
// the same array here and cannot drift apart.

import { create } from 'zustand'

import { isBoundary, pinThrough, reorder, type ColumnPins } from '@busy/ui/columnState'
import type { Invoice } from '../../data/schema/invoice'
import { today } from '../../lib/day'
import { rangeFor, type RangeId } from './dateRanges'
import type { AmountTest, ComplianceId, Sort, Tab } from './filtering'

export type GroupBy = 'none' | 'date' | 'party' | 'partyGroup' | 'salesman'

/** What each grouping is called, in the words the menu uses. One list, so the menu and the chip
 * that reports it can never say different things about the same setting. */
export const GROUP_LABEL: Record<GroupBy, string> = {
  none: 'Default',
  date: 'Date',
  party: 'Party',
  partyGroup: 'Party Group',
  salesman: 'Salesman',
}

export type ListingState = {
  invoices: Invoice[]
  loading: boolean
  /** The day the screen is being read on. Held rather than read from the clock at every call,
   * so a journey can stand still and every derived date agrees with every other. */
  today: string

  tab: Tab
  rangeId: RangeId
  custom: { from: string | null; to: string | null }
  search: string
  searchOpen: boolean
  party: string | null
  total: AmountTest | null
  pending: AmountTest | null
  compliance: ComplianceId[]

  sort: Sort
  groupBy: GroupBy
  lineItems: boolean
  hiddenColumns: string[]
  /** The order columns are shown in, by id. Empty means "as they are declared" — an explicit
   * empty rather than a copy of the declared order, so a column added to the product later
   * appears for somebody who has already dragged one rather than silently going missing. */
  columnOrder: string[]
  /** Which columns are frozen, and to which edge. Order within a side is the order they stack
   * outward from it — pin S.No then Item Name and they sit in that order against the left. More
   * than one a side is the common case rather than the exception: on the item grid you freeze
   * the row's identity, which is two columns, and scroll right through qty, price and tax still
   * knowing which line you are on. */
  columnPins: ColumnPins
  /** Only the columns somebody deliberately dragged. Everything else is measured, because a
   * column's declared width is a Tailwind class and a sticky offset is a number. The store
   * holds intent, not derived state. */
  columnWidths: Record<string, number>

  selected: string[]
  pageNumber: number
  pageSize: number
  /** Which row the keyboard is on, as an index into the page. -1 is "not in the rows". */
  cursor: number

  load: (invoices: Invoice[]) => void
  setTab: (tab: Tab) => void
  setRange: (id: RangeId) => void
  setCustom: (from: string | null, to: string | null) => void
  setSearch: (search: string) => void
  openSearch: (open: boolean) => void
  setParty: (party: string | null) => void
  setTotal: (test: AmountTest | null) => void
  setPending: (test: AmountTest | null) => void
  toggleCompliance: (which: ComplianceId) => void
  sortBy: (by: Sort['by']) => void
  setGroupBy: (groupBy: GroupBy) => void
  setLineItems: (on: boolean) => void
  toggleColumn: (id: string) => void
  /** Freeze everything from an edge up to and including this column — a BOUNDARY, which is what
   * the product document rules and the only shape that cannot leave a hole beside a frozen
   * column. Pressing the column that already holds the boundary lets that edge go. */
  pinColumn: (id: string, side: 'start' | 'end', order: readonly string[]) => void
  /** A width of zero gives the column back to whatever was deciding it before anybody dragged. */
  resizeColumn: (id: string, width: number) => void
  unpinEveryColumn: () => void
  moveColumn: (id: string, toIndex: number) => void
  toggleRow: (id: string, on: boolean) => void
  setAllRows: (ids: string[], on: boolean) => void
  clearSelection: () => void
  setPage: (pageNumber: number) => void
  setPageSize: (size: number) => void
  moveCursor: (to: number) => void
  clearEverything: () => void
}

/** Where the screen starts. Current FY is the default period: the product document says so and
 * both reference builds do it, and only a comment in one of them disagreed. */
const START = {
  tab: 'all' as Tab,
  rangeId: 'currentFy' as RangeId,
  custom: { from: null, to: null },
  search: '',
  searchOpen: false,
  party: null,
  total: null,
  pending: null,
  compliance: [] as ComplianceId[],
  sort: { by: 'date', direction: 'desc' } as Sort,
  groupBy: 'none' as GroupBy,
  lineItems: false,
  selected: [] as string[],
  pageNumber: 1,
  cursor: -1,
}

export const useListing = create<ListingState>((set) => ({
  invoices: [],
  loading: true,
  // The local calendar day, not the UTC one. See `today` in lib/day.ts for why those
  // are not the same thing anywhere east of Greenwich.
  today: today(),
  // The five that are off to begin with. Named rather than derived from a flag on each column,
  // because "which columns does this screen open with" is one decision and reads better as one
  // line than as five scattered `def: false`s.
  hiddenColumns: ['received', 'taxable', 'tax', 'eInvoice', 'eWayBill'],
  columnOrder: [],
  columnPins: { start: [], end: [] },
  columnWidths: {},
  pageSize: 25,
  ...START,

  load: (invoices) => set({ invoices, loading: false }),

  // Every narrowing sends the reader back to page one. Staying on page four of a list that is
  // now two pages long shows an empty table and reads as "your filter found nothing".
  setTab: (tab) => set({ tab, pageNumber: 1, cursor: -1 }),
  setRange: (rangeId) => set({ rangeId, pageNumber: 1, cursor: -1 }),
  setCustom: (from, to) => set({ custom: { from, to }, rangeId: 'custom', pageNumber: 1, cursor: -1 }),
  setSearch: (search) => set({ search, pageNumber: 1, cursor: -1 }),
  openSearch: (searchOpen) => set({ searchOpen }),
  setParty: (party) => set({ party, pageNumber: 1, cursor: -1 }),
  setTotal: (total) => set({ total, pageNumber: 1, cursor: -1 }),
  setPending: (pending) => set({ pending, pageNumber: 1, cursor: -1 }),

  toggleCompliance: (which) =>
    set((state) => ({
      compliance: state.compliance.includes(which)
        ? state.compliance.filter((one) => one !== which)
        : [...state.compliance, which],
      pageNumber: 1,
      cursor: -1,
    })),

  // Pressing the column you are already sorted by turns the sort round. Pressing a new one
  // starts it ascending, which is what every table does and what the hand expects.
  sortBy: (by) =>
    set((state) => ({
      sort: { by, direction: state.sort.by === by && state.sort.direction === 'asc' ? 'desc' : 'asc' },
      cursor: -1,
    })),

  setGroupBy: (groupBy) => set({ groupBy }),
  setLineItems: (lineItems) => set({ lineItems }),

  moveColumn: (id, toIndex) =>
    set((state) => ({ columnOrder: reorder(state.columnOrder, id, toIndex) })),

  // The array juggling lives in packages/ui/columns.ts so both stores fold pins the same way,
  // rather than each writing its own and drifting.
  pinColumn: (id, side, order) =>
    set((state) => ({
      columnPins: isBoundary(state.columnPins, id) === side ? { start: [], end: [] } : pinThrough(order, id, side),
    })),
  unpinEveryColumn: () => set({ columnPins: { start: [], end: [] } }),

  resizeColumn: (id, width) =>
    set((state) => {
      const next = { ...state.columnWidths }
      if (width <= 0) delete next[id]
      else next[id] = width
      return { columnWidths: next }
    }),

  toggleColumn: (id) =>
    set((state) => ({
      hiddenColumns: state.hiddenColumns.includes(id)
        ? state.hiddenColumns.filter((one) => one !== id)
        : [...state.hiddenColumns, id],
    })),

  toggleRow: (id, on) =>
    set((state) => ({
      selected: on ? [...state.selected, id] : state.selected.filter((one) => one !== id),
    })),

  setAllRows: (ids, on) =>
    set((state) => ({
      selected: on ? [...new Set([...state.selected, ...ids])] : state.selected.filter((one) => !ids.includes(one)),
    })),

  clearSelection: () => set({ selected: [] }),
  setPage: (pageNumber) => set({ pageNumber, cursor: -1 }),
  setPageSize: (pageSize) => set({ pageSize, pageNumber: 1, cursor: -1 }),
  moveCursor: (cursor) => set({ cursor }),

  // Escape from anywhere on the screen. It clears what was narrowing the list and lets go of
  // the selection, but it does NOT touch the columns or the density — those are how this
  // person has set the screen up, not what they are currently looking for.
  clearEverything: () => set({ ...START }),
}))

/** The period in force, custom included. Here rather than in the store so it is one answer
 * derived from state, never a second copy of it that can go stale. */
export function rangeOf(state: ListingState) {
  return state.rangeId === 'custom' ? state.custom : rangeFor(state.rangeId, state.today)
}
