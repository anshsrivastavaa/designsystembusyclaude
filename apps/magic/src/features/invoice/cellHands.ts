// Everything a cell needs from the store, gathered ONCE for the whole grid.
//
// WHY THIS EXISTS, and it is the whole performance story after the memo.
//
// Every cell used to subscribe to the store eleven times — six setters, the cursor claim, grid
// engagement, the read-only columns, the item facts. At two thousand rows and ten columns that
// is twenty thousand cells and well over a hundred thousand live subscriptions, and Zustand
// runs every one of their selectors on every `set()`. One arrow key therefore cost 1.3 seconds
// of pure script, with barely a millisecond of layout in it — which is why the obvious remedy
// (forced layouts, virtualisation) was aimed at the wrong thing entirely.
//
// The grid subscribes once and hands these down. They are STABLE — Zustand's actions never
// change identity — so passing them as props costs a memo comparison and nothing else.

import type { Item } from '../../data/schema/item'
import type { ColumnId, Cursor } from '../../lib/keyboard'

export type ItemFacts = { stock: number; hsn: string; alias: string; lastRatePaise: number; listRatePaise: number; mrpPaise: number }

export type CellHands = {
  moveTo: (cursor: Cursor) => void
  setCell: (column: ColumnId, rowIndex: number, typed: string) => void
  applyItem: (rowIndex: number, item: Item) => void
  setItemText: (rowIndex: number, text: string) => void
  askFor: (field: 'party' | 'item', message: string) => void
  readOnlyColumns: readonly ColumnId[]
}
