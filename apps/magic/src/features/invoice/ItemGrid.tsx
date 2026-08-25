// The item grid. Divs with grid roles rather than a real table, so a frozen column,
// virtualisation and content-visibility all stay available later — CSS containment does not
// apply inside a real table.
//
// The roles are hand-written and therefore have to be right, so they are tested as roles and
// as behaviour, never as markup.

import { useEffect, useMemo, useRef, useState } from 'react'

import { Icon } from '@busy/ui/Icon'
import { columnsFor, lastFilledRow, type ColumnId } from '../../lib/keyboard'
import { useInvoice } from './store'
import { ItemRow } from './ItemRow'
import { HEADINGS, type OptionalColumn } from './gridColumns'
import { GridHeadings } from './GridHeadings'
import { GridColumnSetup } from './GridColumnSetup'
import { GridSummary } from './GridSummary'
import { useGridHands } from './useGridHands'
import { useGridKeys } from './gridKeys'
import { useRowsThatFit } from './rowsThatFit'
import { columnTotals } from './columnTotals'
import { isFitted, useGridLayout } from './gridLayout'
import { useGridStyles } from './gridStyles'
import { orderedColumns } from './gridOrder'

/** A row is invalid on the cell that is wrong, never on the whole row. */
function invalidColumnOf(quantity: number, pricePaise: number): ColumnId | null {
  if (quantity < 0) return 'quantity'
  if (pricePaise < 0) return 'price'
  return null
}

export function ItemGrid({ onSetColumn }: { onSetColumn?: (id: OptionalColumn, on: boolean) => void }) {
  const rows = useInvoice((state) => state.rows)
  const cursor = useInvoice((state) => state.cursor)
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
  const natural = useMemo(() => columnsFor(settings.taxMode, settings.columns), [settings.taxMode, settings.columns])
  const order = useGridLayout((state) => state.order)
  const widths = useGridLayout((state) => state.widths)
  const moveColumn = useGridLayout((state) => state.moveColumn)
  const resetColumns = useGridLayout((state) => state.resetColumns)
  const columns = useMemo(() => orderedColumns(natural, order), [natural, order])
  const fitted = isFitted(widths)

  const engageGrid = useInvoice((state) => state.engageGrid)
  const card = useRef<HTMLDivElement>(null)
  const headings = useRef<HTMLDivElement>(null)
  const sideways = useRef<HTMLDivElement>(null)
  const setupButton = useRef<HTMLButtonElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [setupAt, setSetupAt] = useState<{ x: number; y: number } | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const visibleRows = useRowsThatFit(card, scroller)
  const handleKeyDown = useGridKeys(columns)

  const { lines, totalOf } = columnTotals(rows)

  // Everything about how the columns are laid out — what each one measures, what a drag does,
  // what is frozen and what style that puts on a cell — in one place. See gridStyles.ts.
  const { layout, styleOf, edges, frozen } = useGridStyles(columns, headings)

  // Fill the visible height, and keep one row beyond the last line that has something in it.
  //
  // Counted from the FILLED rows and not from the cursor. Counting from the cursor meant the
  // invoice grew every time somebody held the down arrow — thirty presses on an empty invoice
  // took it from thirteen rows to thirty-two, and it would have kept going.
  const lastFilled = lastFilledRow(rows.map((row) => row.itemId !== null))
  useEffect(() => {
    keepRoomFor(Math.max(visibleRows, lastFilled + 2))
  }, [visibleRows, lastFilled, keepRoomFor])

  return (
    <div
      ref={card}
      role="grid"
      aria-label="Invoice items"
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length}
      onKeyDown={handleKeyDown}
      onFocusCapture={engageGrid}
      // NO INNER VERTICAL SCROLLER, AND NO HEIGHT OF ITS OWN. The screen is one scrolling
      // column: the party header, the grid and the footer travel together and the page scrolls.
      // NO `overflow-hidden` HERE: any overflow value but `visible` makes this a scroll
      // container, and the headings stick to it instead of to the page.
      className="relative flex flex-col rounded-card border border-stroke bg-surface"
    >
      {/* THE COLUMN-SETUP DOOR FLOATS OVER THE CARD AND TAKES NO WIDTH FROM ANY ROW, which is
          what v2 does with its own.
          ON THE CARD AND NOT IN THE HEADING BOX, and that is the second place it has been. Inside
          the box it took twenty-six pixels out of the heading row that the body rows never gave up
          — every column's rule drifted, exactly to the button's width by the last one. Moved out
          of the row and into the box it stopped doing that and started drifting itself: `right-0`
          inside a scroll container resolves against the CONTENT, so once the grid was scrolled
          sideways the button sat wherever the scroll had left it. The card is the nearest thing
          that never scrolls.
          It is also outside `role="row"`, where a bare button among the columnheaders is an
          element a grid's roles have no place for. */}
      <button
        ref={setupButton}
        type="button"
        aria-label="Column setup"
        onClick={() => { setSetupAt(null); setSetupOpen(true) }}
        className="absolute top-0 right-0 z-30 flex size-control-sm items-center justify-center rounded-tr-card rounded-bl-card bg-surface-sunken text-ink-secondary hover:text-ink focus-ring"
      >
        <Icon name="settings" className="size-icon-sm" />
      </button>

      {/* THE HEADINGS IN THEIR OWN BOX, AND THE BOX IS WHAT STICKS. It has to be two boxes: the
          heading has to hold its place against the PAGE scrolling down and against the GRID
          scrolling sideways, and an element can only be sticky inside one scroller. Measured —
          a heading inside the sideways scroller sat a whole screen above the top of the page after
          scrolling, because `overflow-x: auto` makes the browser compute `overflow-y: auto` too
          and the heading then sticks to a box that never travels. So this box sticks to the
          page, clips instead of scrolling, and is driven sideways from the rows below. */}
      <div
        ref={headings}
        className="sticky top-0 z-10 shrink-0 overflow-x-hidden rounded-t-card"
      >
        <GridHeadings
          columns={columns}
          taxMode={settings.taxMode}
          readOnlyColumns={readOnlyColumns}
          layout={layout}
          styleOf={styleOf}
          fitted={fitted}
          edges={edges}
          onOpenSetup={(at) => { setSetupAt(at ?? null); setSetupOpen(true) }}
          onMoveColumn={(id, toIndex) => moveColumn(id, toIndex, columns)}
          onResetColumns={resetColumns}
        />
      </div>

      {readOnlyColumns.includes(cursor.column) ? (
        <p role="status" className="shrink-0 border-b border-stroke px-3 py-1 text-sm text-ink-secondary">
          {HEADINGS[cursor.column]} is read-only for your user. Ask an administrator to change
          your rights.
        </p>
      ) : null}

      {/* THE GRID TAKES ITS OWN SIDEWAYS SCROLL, AND THAT IS NOT A BREACH OF THE ONE-COLUMN
          RULING. That ruling's stated reason is two scrollbars and a guess about which one the
          wheel is on, which is an argument about the VERTICAL axis and only that — a page and a
          table cannot both own the wheel. Nothing competes sideways: the page has no horizontal
          scroll at all. v2's own comment records the other half, that taking a grid's scroll
          away made lines unreachable, and it took its scroll back for that reason.
          Left with no sideways scroll, a column dragged wider simply cannot be reached.
          `data-sideways-only` is how the row counter knows this box is not the screen. */}
      <div
        ref={sideways}
        data-sideways-only="true"
        onScroll={(event) => {
          if (headings.current !== null) headings.current.scrollLeft = event.currentTarget.scrollLeft
        }}
        className="overflow-x-auto"
      >
        <div ref={scroller} className={fitted ? 'w-max min-w-full' : ''}>
          {rows.map((row, index) => (
            <ItemRow
              key={row.id}
              row={row}
              index={index}
              cursorColumn={cursor.row === index ? cursor.column : null}
              invalidColumn={invalidColumnOf(row.quantity, row.pricePaise)}
              selected={selectedRowIds.includes(row.id)}
              columns={columns}
              styleOf={styleOf}
              frozen={frozen}
              edges={edges}
              fitted={fitted}
              hands={hands}
              facts={row.itemId === null ? undefined : itemFacts[row.itemId]}
              gridEngaged={gridEngaged}
              // ONLY THE CURSOR ROW IS TOLD. The claim goes up on every move, so handing it to
              // every row made every row's props change on every arrow key — memo could never
              // return true and all two thousand re-rendered.
              cursorClaim={cursor.row === index ? cursorClaim : 0}
            />
          ))}
        </div>

        <GridSummary
          columns={columns}
          styleOf={styleOf}
          frozen={frozen}
          edges={edges}
          fitted={fitted}
          lines={lines}
          totalOf={totalOf}
        />
      </div>

      <GridColumnSetup
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        anchorRef={setupButton}
        {...(setupAt ? { at: setupAt } : {})}
        columns={allColumnsFor(settings.taxMode)}
        shown={settings.columns}
        {...(onSetColumn ? { onSetColumn } : {})}
      />
    </div>
  )
}

/** Every column this tax mode CAN show, on or off — which is what the setup list needs and is
 * not what the grid draws. Asked of the same function the grid uses, with every switch on, so
 * the list can never name a column the grid does not know how to draw. */
function allColumnsFor(taxMode: 'itemExclusive' | 'itemInclusive' | 'billWise'): readonly ColumnId[] {
  return columnsFor(taxMode, { discount: true, alias: true, hsn: true, mrp: true, freeQuantity: true })
}
