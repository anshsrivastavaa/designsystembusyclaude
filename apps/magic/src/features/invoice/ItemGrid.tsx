// The item grid. Divs with grid roles rather than a real table, so a frozen column,
// virtualisation and content-visibility all stay available later — CSS containment does not
// apply inside a real table.
//
// The roles are hand-written and therefore have to be right, so they are tested as roles and
// as behaviour, never as markup.

import { useCallback, useEffect, useMemo, useRef } from 'react'

import { columnsFor, enterNeedsNewRow, lastFilledRow, onArrow, onEnter, onTab, type ColumnId } from '../../lib/keyboard'
import { actionFor } from '../../lib/shortcuts'
import { useInvoice } from './store'
import { ItemRow } from './ItemRow'
import { AMOUNT_HEADING, HEADINGS, WIDTHS } from './gridColumns'
import { GridSummary } from './GridSummary'
import { useGridHands } from './useGridHands'
import { useRowsThatFit } from './rowsThatFit'
import { columnTotals } from './columnTotals'


/** A row is invalid on the cell that is wrong, never on the whole row. */
function invalidColumnOf(quantity: number, pricePaise: number): ColumnId | null {
  if (quantity < 0) return 'quantity'
  if (pricePaise < 0) return 'price'
  return null
}

export function ItemGrid() {
  const rows = useInvoice((state) => state.rows)
  const cursor = useInvoice((state) => state.cursor)
  const moveTo = useInvoice((state) => state.moveTo)
  const appendRow = useInvoice((state) => state.appendRow)
  const keepRoomFor = useInvoice((state) => state.keepRoomFor)
  const settings = useInvoice((state) => state.settings)
  const { hands, gridEngaged, cursorClaim, itemFacts } = useGridHands()
  const selectedRowIds = useInvoice((state) => state.selectedRowIds)
  const readOnlyColumns = hands.readOnlyColumns

  // The order on the screen, the order the arrows walk and the order Tab follows, from one
  // list — so the three can never disagree about where Tax % is.
  // MEMOISED. columnsFor() returns a fresh array, so passing it straight into a memo()'d row
  // made every row's props different every render: memo could never return true. Measured at
  // 2000 rows — 4,000 ItemRow renders per keystroke, now 4.
  //
  // WHAT THE MEMO DOES NOT FIX, since the number matters more than a pointer to it: a keystroke
  // at 2000 rows still costs about 108ms, and it was never layout — there is barely a
  // millisecond of it in the profile. That is why virtualisation was the wrong remedy and there
  // is no virtualiser here.
  const columns = useMemo(() => columnsFor(settings.taxMode, settings.columns), [settings.taxMode, settings.columns])
  const engageGrid = useInvoice((state) => state.engageGrid)
  const card = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const visibleRows = useRowsThatFit(card, scroller)

  const { lines, totalOf } = columnTotals(rows)

  // Fill the visible height, and keep one row beyond the last line that has something in it.
  //
  // Counted from the FILLED rows and not from the cursor. Counting from the cursor meant the
  // invoice grew every time somebody held the down arrow — thirty presses on an empty invoice
  // took it from thirteen rows to thirty-two, and it would have kept going.
  const lastFilled = lastFilledRow(rows.map((row) => row.itemId !== null))
  useEffect(() => {
    keepRoomFor(Math.max(visibleRows, lastFilled + 2))
  }, [visibleRows, lastFilled, keepRoomFor])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Which action a key means is decided in one table, in lib/shortcuts.ts, and nowhere
      // else. What the action does is this screen's business.
      const action = actionFor(event)
      if (action === null) return

      // Read the cursor from the store, not from this render. Keys arriving faster than React
      // redraws — a held arrow, a fast typist — would otherwise all act on the same stale
      // position, and most of them would do nothing at all.
      const { cursor: at, rows: walking } = useInvoice.getState()

      // SHIFT AND SPACE PICKS THE LINE. Only a line that HAS something on it: a blank row is
      // padding waiting to be typed into, and picking three of those to delete would take away
      // rows the grid puts straight back.
      if (action === 'select-record') {
        event.preventDefault()
        const standing = walking[at.row]
        if (standing !== undefined && standing.itemId !== null) useInvoice.getState().toggleSelected(standing.id)
        return
      }

      if (action === 'complete-row') {
        event.preventDefault()
        if (enterNeedsNewRow(at, walking.length)) appendRow()
        moveTo(onEnter(at, walking.length + 1))
        return
      }

      const directions = { 'move-left': 'left', 'move-right': 'right', 'move-up': 'up', 'move-down': 'down' } as const
      if (action in directions) {
        event.preventDefault()
        moveTo(onArrow(at, directions[action as keyof typeof directions], walking.length, columns))
        return
      }

      if (action === 'last-filled-row') {
        event.preventDefault()
        moveTo({ row: lastFilledRow(walking.map((row) => row.itemId !== null)), column: at.column })
        return
      }

      if (action === 'first-row') {
        event.preventDefault()
        moveTo({ row: 0, column: at.column })
        return
      }

      const row = walking[at.row]
      const unitSettled = row !== undefined && row.itemId !== null && row.unit !== ''
      const next = onTab(at, action === 'previous-field', unitSettled, columns)
      if (next === 'leave') return
      event.preventDefault()
      moveTo(next)
    },
    [moveTo, appendRow, columns],
  )

  return (
    <div
      ref={card}
      role="grid"
      aria-label="Invoice items"
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length}
      onKeyDown={handleKeyDown}
      onFocusCapture={engageGrid}
      // NO INNER SCROLLER, AND NO HEIGHT OF ITS OWN. The screen is one scrolling column: the
      // party header, the grid and the footer travel together and the page scrolls. A table
      // that scrolls inside a page that also scrolls gives the user two scrollbars and a
      // guess about which one they are on — v2 calls its own inner scroll a regression, in
      // those words, and this is that ruling arriving here.
      // NO `overflow-hidden` HERE: any overflow value but `visible` makes this a scroll
      // container, and the headings stick to it instead of to the page. The corners are
      // rounded where they actually are — on the heading row and on the summary row that now
      // closes the table — rather than clipped off a square child by its parent.
      className="flex flex-col rounded-card border border-stroke bg-surface"
    >
      {/* The headings stay put against the PAGE scroll, so a column is still named when the
          rows have travelled. Sticky, not pinned: they leave with the grid. */}
      <div
        ref={heading}
        role="row"
        aria-rowindex={1}
        className="sticky top-0 z-10 flex shrink-0 items-stretch rounded-t-card border-b border-stroke bg-surface-sunken"
      >
        {columns.map((column, at) => (
          <div
            key={column}
            role="columnheader"
            aria-colindex={at + 1}
            // v2's SPECIES of heading, and it is a species rather than a size: small, upper
            // case, letterspaced and muted. Sentence case at body size reads as another row of
            // the table — the eye has to decide each time whether it is data. These cannot be
            // read as data, which is the whole job of a column heading.
            className={`flex h-control-sm items-center border-r border-stroke px-2 text-caps font-strong uppercase tracking-wide text-ink-muted last:border-r-0 ${WIDTHS[column]} ${
              column === 'quantity' || column === 'price' || column === 'amount' ? 'justify-end' : ''
            }`}
          >
            {readOnlyColumns.includes(column) ? (
              // A padlock in the heading, and nothing on the cells. The column is read-only
              // all day for this user, so the fact belongs to the column and not to each row.
              <span aria-label="read-only" title="Read-only for your user" className="mr-1">
                🔒
              </span>
            ) : null}
            {column === 'amount' ? AMOUNT_HEADING[settings.taxMode] : HEADINGS[column]}
          </div>
        ))}
      </div>

      {readOnlyColumns.includes(cursor.column) ? (
        <p role="status" className="shrink-0 border-b border-stroke px-3 py-1 text-sm text-ink-secondary">
          {HEADINGS[cursor.column]} is read-only for your user. Ask an administrator to change
          your rights.
        </p>
      ) : null}

      <div ref={scroller}>
        {rows.map((row, index) => (
          <ItemRow
            key={row.id}
            row={row}
            index={index}
            cursorColumn={cursor.row === index ? cursor.column : null}
            invalidColumn={invalidColumnOf(row.quantity, row.pricePaise)}
            selected={selectedRowIds.includes(row.id)}
            columns={columns}
            widths={WIDTHS}
            hands={hands}
            facts={row.itemId === null ? undefined : itemFacts[row.itemId]}
            gridEngaged={gridEngaged}
            // ONLY THE CURSOR ROW IS TOLD. The claim goes up on every move, so handing it to
            // every row made every row's props change on every arrow key — memo could never
            // return true and all two thousand re-rendered. The rows that are not under the
            // cursor do not need to know that somebody claimed it somewhere else.
            cursorClaim={cursor.row === index ? cursorClaim : 0}
          />
        ))}
      </div>

      <GridSummary columns={columns} widths={WIDTHS} lines={lines} totalOf={totalOf} />
    </div>
  )
}
