// What a Table is made of, as types. Separate from Table.tsx because a feature declaring its
// columns imports these and nothing else — the listing's column list is a data file, and it
// should not have to pull in a component to describe itself.

import type * as React from 'react'

import type { ColumnLayout } from './columns'

export type TableColumn<Row> = {
  id: string
  header: string
  cell: (row: Row) => React.ReactNode
  /** Figures are read down their right edge, words down their left. */
  align?: 'start' | 'end'
  /** A Tailwind width utility for this column's <col>. Omit and the column shares what is left. */
  width?: string
  sortable?: boolean
  /** Off for a column nobody should be able to drag narrower — a tick box, a row-actions
   * column. Everything else is resizable once a table is given a layout. */
  resizable?: boolean
}

export type TableSort = { columnId: string; direction: 'asc' | 'desc' }

export type TableSelection = {
  selected: ReadonlySet<string>
  onToggle: (id: string, next: boolean) => void
  onToggleAll: (next: boolean) => void
  /** What the header tick is choosing, read out before the count. */
  label: string
}

export type TableProps<Row> = {
  columns: TableColumn<Row>[]
  rows: Row[]
  getRowId: (row: Row) => string
  /** What the table as a whole is listing. Read out before any row. */
  label: string
  /** A row that is no longer live — cancelled, voided. Drawn in muted ink. NOT struck through:
   * a line through every cell makes the row hard to read at the moment somebody is checking
   * what it said, and the Status column already carries the word. */
  isMuted?: (row: Row) => boolean
  /** Which group a row belongs to, or null for none. Rows must already be in group order; the
   * table draws a heading each time the answer changes. */
  groupOf?: (row: Row) => string | null
  selection?: TableSelection
  sort?: TableSort
  onSort?: (columnId: string) => void
  /** A right-click on any column heading, with where it happened. v2 opens column setup from
   * here on both its tables. The table reports the press; what it opens is the screen's. */
  onHeaderMenu?: (at: { x: number; y: number }) => void
  /** A column has been dragged to a new place: move `columnId` so it sits at `toIndex` in the
   * order handed in. The TABLE does the dragging; the CALLER owns the order, because the order
   * is something a person set and expects to still be there tomorrow. */
  onReorder?: (columnId: string, toIndex: number) => void
  /** Buttons for one row. Out of sight until the row is hovered OR something in it has the
   * keyboard, so the keyboard reaches them as well as the mouse. */
  rowActions?: (row: Row) => React.ReactNode
  /** Figures under their own columns, keyed by column id. */
  totals?: Record<string, React.ReactNode>
  /** What sits at the left of the totals bar, under the columns that have nothing to total.
   * The pager lives here, and whatever else belongs to the whole table rather than to a column.
   * Give `totals` no figures at all and this gets the whole bar. */
  /** Given a function, it is told whether the totals row is at rest at the foot of the card or
   * stuck part way up it — which is the difference between a bar that may wear the card's bottom
   * corners and one that must not. */
  totalsLabel?: React.ReactNode | ((state: { atFoot: boolean }) => React.ReactNode)
  /** Shown instead of the rows when there are none. Say why there are none, not just that. */
  empty: React.ReactNode

  /** WHICH ROW THE KEYBOARD IS ON, as an index into the rows given. Pass it and the rows
   * become a keyboard walk: one tab stop for the whole table, arrows move between rows.
   * Leave it out and the table is a plain table whose contents are individually tabbable.
   *
   * -1 means the keyboard has not entered the rows yet. The first row is still the tab stop,
   * so Tab reaches the table; arriving there is what sets the cursor to 0. */
  cursor?: number
  onCursorChange?: (index: number) => void
  /** A key pressed while the keyboard is on a row. The TABLE owns where the keyboard is; the
   * caller owns what a key MEANS, because that is decided in one table for the whole product
   * and a component in packages/ui cannot see it. */
  onRowKeyDown?: (event: React.KeyboardEvent, index: number) => void

  /** Resizing and freezing, from `useColumns`. Leave it out and the table is neither, which is
   * every table that has not asked for them. */
  layout?: ColumnLayout
}
