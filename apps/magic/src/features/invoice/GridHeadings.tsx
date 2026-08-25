// The item grid's heading row: what each column is called, and every control that changes the
// columns themselves — drag an edge to resize, drag a heading to move it, freeze up to here,
// and the setup list.
//
// OUT OF ItemGrid.tsx, which the 250-line cap correctly said was two things by then: a grid,
// and a header full of controls that happen to sit above it.
//
// THREE TAB STOPS FOR THE WHOLE ROW, NOT THREE PER COLUMN. A stop on every column's resize
// handle would put thirteen of them in front of a grid that is one stop itself, on a product
// people drive from the keyboard. So the headings rove: one Tab lands on the row, the left and
// right arrows walk between headings, and the pin and the drag handle belong to whichever
// heading you are on. The handle keeps the keyboard resize the engine gave it — this changes
// which handle Tab reaches, never whether one can be reached at all.
//
// ARROW KEYS ARE STOPPED HERE. The grid binds them to move the cursor between cells and listens
// on the whole grid, so without this, walking the headings also walked the cursor.

import * as React from 'react'
import { useRef, useState } from 'react'

import { actionFor } from '../../lib/shortcuts'
import { TableHeading } from '@busy/ui/TableHeading'
import { Icon } from '@busy/ui/Icon'
import type { ColumnLayout } from '@busy/ui/columns'
import type { ColumnId } from '../../lib/keyboard'
import type { TaxMode } from '../../data/schema/settings'
import { AMOUNT_HEADING, freezeSideOf, HEADINGS, WIDTHS } from './gridColumns'
import { alignmentOf } from './cellContent'

export type GridHeadingsProps = {
  columns: readonly ColumnId[]
  taxMode: TaxMode
  readOnlyColumns: readonly ColumnId[]
  layout: ColumnLayout
  /** Width and freeze for each column, worked out once by the grid. */
  styleOf: Record<string, React.CSSProperties>
  /** True once somebody has dragged an edge: the columns are pixels now, so the grow weights
   * come off — flex-basis beats an inline width, and the column would ignore the drag. */
  fitted: boolean
  /** The one column in each block that draws the edge line. */
  edges: { start: ColumnId | null; end: ColumnId | null }
  onOpenSetup: (at?: { x: number; y: number }) => void
  onMoveColumn: (id: ColumnId, toIndex: number) => void
  /** Everything back to how the screen opens. v2 hangs it off a double-click on the row-number
   * heading, which is the one column nobody drags anywhere, and says so in its tooltip. */
  onResetColumns: () => void
}

export function GridHeadings({
  columns, taxMode, readOnlyColumns, layout, styleOf, fitted, edges, onOpenSetup, onMoveColumn, onResetColumns,
}: GridHeadingsProps) {
  const [walkingAt, setWalkingAt] = useState(0)
  const dragging = useRef<ColumnId | null>(null)
  const [over, setOver] = useState<ColumnId | null>(null)
  // Turning a column off shortens the row under the roving stop, so it is clamped on the way
  // out rather than trusted: a tabIndex of 0 on nothing is a row Tab cannot reach.
  const on = Math.min(walkingAt, columns.length - 1)

  const walk = (event: React.KeyboardEvent, index: number, column: ColumnId) => {
    // Which key means what is decided in one table for the whole product, and the heading row is
    // its own place in it: here the arrows walk between headings rather than between cells.
    const action = actionFor(event, 'headings')
    if (action === null) return
    const step = action === 'move-left' || action === 'move-column-left' ? -1 : 1
    event.preventDefault()
    event.stopPropagation()
    const to = Math.max(0, Math.min(index + step, columns.length - 1))
    // HELD WITH Ctrl, THE ARROW MOVES THE COLUMN instead of walking to the next one — the same
    // key for the same direction, which is what a person already expects from any list they can
    // reorder. It is the whole keyboard path for reordering, so it may not be a menu item.
    if (action === 'move-column-left' || action === 'move-column-right') {
      onMoveColumn(column, to)
      setWalkingAt(to)
      return
    }
    setWalkingAt(to)
    event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="columnheader"]')[to]?.focus()
  }

  return (
    <div
      role="row"
      aria-rowindex={1}
      onContextMenu={(event) => {
        event.preventDefault()
        onOpenSetup({ x: event.clientX, y: event.clientY })
      }}
      className={`flex items-stretch border-b border-stroke bg-surface-sunken ${fitted ? 'w-max min-w-full' : ''}`}
    >
      {columns.map((column, at) => {
        // ONE ALIGNMENT ANSWER PER COLUMN, and the heading now reads it from the same place the
        // cells do. They were two rules — the heading justified three columns by name, the cells
        // asked `alignmentOf` — so HSN's heading sat left over right-set figures. And the pin mark
        // has to sit on the side the block runs towards, which only means anything if the heading
        // and the column agree about which side that is.
        const align = alignmentOf(column)
        const side = freezeSideOf(column)
        return (
        // `TableHeading` as a div, because this grid is hand-written markup wearing grid roles
        // and a <th> outside a <tr> is invalid. The species of heading — small, upper case,
        // letterspaced — was written out here and again in the listing, and the two had drifted.
        //
        // `sticky={false}` because the ROW sticks, not the cell. What stays behind is what this
        // grid owns and the listing has no opinion about: the width, the rule between columns,
        // the row height and which columns read right.
        <TableHeading
          key={column}
          as="div"
          sticky={false}
          ref={layout.measure(column)}
          aria-colindex={at + 1}
          // NAMED EXPLICITLY, because a heading's name is otherwise read off everything inside
          // it — and the freeze control and the resize handle are inside it. Left to itself the
          // column announced as "Item Name Freeze up to this column", which is what a screen
          // reader would then say before every cell in it.
          aria-label={column === 'amount' ? AMOUNT_HEADING[taxMode] : HEADINGS[column]}
          tabIndex={at === on ? 0 : -1}
          style={styleOf[column] ?? {}}
          // The row number cannot be dragged out of first place. It is not a column of the
          // invoice, it is where you are in it — v2 holds it still for the same reason.
          draggable={column !== 'serial'}
          onFocus={() => setWalkingAt(at)}
          {...(column === 'serial'
            ? { onDoubleClick: onResetColumns, title: 'Double-click to reset the column layout' }
            : {})}
          onKeyDown={(event) => walk(event, at, column)}
          onDragStart={() => { dragging.current = column }}
          onDragOver={(event) => {
            if (dragging.current === null || dragging.current === column) return
            event.preventDefault()
            setOver(column)
          }}
          onDragLeave={() => setOver((was) => (was === column ? null : was))}
          onDrop={(event) => {
            event.preventDefault()
            const moved = dragging.current
            dragging.current = null
            setOver(null)
            if (moved !== null && moved !== column) onMoveColumn(moved, at)
          }}
          onDragEnd={() => { dragging.current = null; setOver(null) }}
          className={`group/head flex h-control-sm cursor-grab items-center border-r px-2 select-none last:border-r-0 ${
            // EACH BLOCK DRAWS ONE EDGE, on the side it is held against: a left block's line on
            // the right of its last column, a right block's on the left of its first. A line on
            // every frozen column reads as a table of narrow tables; a line on none leaves the
            // block with no edge to be frozen against. Read out of v2's source.
            column === edges.start ? 'border-stroke-strong' : 'border-stroke'
          } ${column === edges.end ? 'border-l border-l-stroke-strong' : ''} ${
            fitted ? '' : WIDTHS[column]
          } ${align === 'end' ? 'justify-end' : ''}`}
        >
          {/* WHERE THE COLUMN WOULD LAND, drawn on the edge it would land against rather than as
              a tint on the whole heading. A tinted heading says "this one", and the answer to
              "where" is a position between two columns, not a column. */}
          {over === column ? <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" /> : null}

          {readOnlyColumns.includes(column) ? (
            // A padlock in the heading, and nothing on the cells. The column is read-only all
            // day for this user, so the fact belongs to the column and not to each row.
            <span aria-label="read-only" title="Read-only for your user" className="mr-1">
              🔒
            </span>
          ) : null}
          <span className="truncate">{column === 'amount' ? AMOUNT_HEADING[taxMode] : HEADINGS[column]}</span>

          {/* THE MARK SITS ON THE SIDE THE BLOCK RUNS TOWARDS, so it points at what it did: to
              the RIGHT of a left-aligned column's label, to the LEFT of a right-aligned one's.
              Rendered before or after the label for the same reason a reader expects it there,
              and positioned out of the flow either way so no space is reserved for it. */}
          <PinControl pin={layout.pinFor(column)} side={side} reachable={at === on} />

          {/* The edge you drag. Always draggable by mouse; its tab stop roves with the heading.
              Its own dragstart is cancelled, or grabbing the edge would pick the column up
              instead of resizing it — the heading around it is a drag source. */}
          <span
            {...layout.handleFor(column)}
            tabIndex={at === on ? 0 : -1}
            onDragStart={(event) => event.preventDefault()}
            className="absolute inset-y-0 right-0 w-2 cursor-col-resize"
          />
        </TableHeading>
        )
      })}

    </div>
  )
}

/** SHOWN ON HOVER AND ON FOCUS, NEVER AT REST — the engine's own ruling, and the focus half is
 * the whole of it: without it a keyboard user can reach "Unpin all" in the setup list and can
 * never freeze anything. A frozen column keeps its mark showing, because a state with no
 * standing signal is a state nobody can find again. */
function PinControl({
  pin, side, reachable,
}: {
  pin: ReturnType<ColumnLayout['pinFor']>
  side: 'start' | 'end'
  reachable: boolean
}) {
  if (pin === null) return null
  return (
    <button
      type="button"
      // THE ENGINE DECIDES THE SIDE FROM THE COLUMN'S OWN ALIGNMENT, which is handed to it as
      // `align` on each spec — see gridStyles.ts. This used to override the control's `onClick`
      // because `pinFor` froze from the start whatever the column was; session B fixed it at
      // source on 25-08, so the control is taken whole again.
      {...pin}
      tabIndex={reachable ? 0 : -1}
      // OUT OF THE FLOW, SO IT TAKES NO WIDTH WHEN THERE IS NO PIN. In the flow it was a real
      // flex child in every heading — invisible at rest, and still occupying content width, which
      // held the heading cells wider than the body cells could shrink to. Measured: the columns'
      // rules drifted up to 1.4px between the heading and the rows underneath, and go to exactly
      // zero with this out of the flow.
      className={`absolute shrink-0 opacity-0 group-hover/head:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100 ${
        side === 'start' ? 'right-3' : 'left-2'
      }`}
    >
      <Icon name="pin" className="size-icon-sm" />
    </button>
  )
}
