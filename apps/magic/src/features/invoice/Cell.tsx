// One cell. It shows text until the cursor arrives, and only then does it become a field.
//
// That is not a shortcut, it is the reason two thousand rows are cheap: three inputs a row
// would be six thousand form controls in the page before anyone has typed anything.

import { useLayoutEffect, useRef } from 'react'

import type { ColumnId } from '../../lib/keyboard'
import type { InvoiceRow } from '../../data/schema/invoice'
import { InvalidMark } from './InvalidMark'
import type { CellHands, ItemFacts } from './cellHands'
import { ItemCell } from './ItemCell'
import { EditableCell } from './EditableCell'
import { alignmentOf, cellIsEditable, readOnlyText } from './cellContent'

type CellProps = {
  /** Whether the cursor is anywhere on this row — the field boundary is drawn per row. */
  onCursorRow: boolean
  /** Handed down rather than subscribed to. See cellHands.ts — a cell that reads the store
   * itself costs a selector run on every keystroke, times twenty thousand cells. */
  hands: CellHands
  facts: ItemFacts | undefined
  gridEngaged: boolean
  cursorClaim: number
  column: ColumnId
  row: InvoiceRow
  index: number
  cursor: ColumnId | null
  invalid: ColumnId | null
  width: string
  /** Picked for deleting: the tick takes the gutter, so the number steps aside for it. */
  selected: boolean
}

export function Cell({ column, row, index, cursor, invalid, width, onCursorRow, hands, facts, gridEngaged, cursorClaim, selected }: CellProps) {
  const { moveTo, readOnlyColumns, setCell } = hands
  const isCursor = cursor === column
  const isInvalid = invalid === column
  const ref = useRef<HTMLInputElement>(null)
  const plainRef = useRef<HTMLDivElement>(null)

  // Read-only is a property of the COLUMN, not of this row. It draws as SHAPE: an editable
  // cell shows a field boundary when the cursor is on its row, and a read-only one never
  // does. No tint — for an operator who cannot change price, that column is read-only all
  // day, so it is their normal rather than something to flag.
  const readOnly = readOnlyColumns.includes(column)
  const editable = cellIsEditable(column) && !readOnly


  // A cell that holds the cursor holds the keyboard. That has to include the cells nobody
  // types into: without it, one arrow key onto Amount dropped focus to the page body and
  // every key after that went nowhere, while the grid went on drawing its ring in the right
  // place. The ring was right and the keyboard was gone.
  // Runs BEFORE the browser paints, and does nothing unless the keyboard has actually gone
  // missing. Before rather than after because moving the cursor unmounts one cell's field and
  // mounts the next: restoring focus after the paint leaves a gap in which a keypress lands
  // on the page body and is lost, which is what a held arrow key does. A re-render can replace the element under the cursor — the grid
  // pads itself with rows while you type — and an effect that only fires when the cursor
  // MOVES cannot notice that. Self-healing beats a longer dependency list.
  // TWO REASONS THE KEYBOARD MOVES HERE, AND THEY ARE NOT THE SAME REASON.
  //
  // ONE: the cursor ARRIVED. Somebody picked a party and the cursor went to the first item
  // cell, or an arrow key moved it. That is deliberate, so the keyboard follows it in from
  // wherever it was — including from outside the grid.
  useLayoutEffect(() => {
    if (!isCursor || !gridEngaged) return
    const target = ref.current ?? plainRef.current
    if (!target) return
    if (target === document.activeElement || target.contains(document.activeElement)) return
    target.focus()
    // Arriving at a cell that already holds a value selects it, so the next thing typed
    // replaces it — the way a spreadsheet behaves.
    ref.current?.select()
    // `cursorClaim` and not just the position: picking a party places the cursor on the first
    // item cell, and when the cursor was ALREADY there nothing about the position changed —
    // so the keyboard stayed in the party field. The journey stayed green because it only ever
    // walks the FIRST engagement of the grid, where `gridEngaged` flips and carries the effect
    // with it. Once the grid has been touched, that never changes again.
  }, [isCursor, gridEngaged, column, cursorClaim])

  // TWO: the element under the cursor was REPLACED by a re-render — the grid fills itself with
  // rows while you type — and the keyboard fell on the page body. An effect that only fires
  // when the cursor moves cannot notice that, so this one runs every render.
  //
  // It heals ONLY a keyboard that is genuinely lost, or one that is still inside this grid.
  // When the grid was the only thing on the screen those were the same sentence; they are not
  // any more. Clicking a charge field put focus there and this hauled it straight back, so the
  // next keypress went to the grid and vanished — a fast operator lost the first thing they
  // typed, every time.
  useLayoutEffect(() => {
    if (!isCursor || !gridEngaged) return
    const target = ref.current ?? plainRef.current
    if (!target) return
    if (target === document.activeElement || target.contains(document.activeElement)) return

    const active = document.activeElement
    const lost = active === null || active === document.body
    const stillInThisGrid = active instanceof Node && target.closest('[role="grid"]')?.contains(active) === true
    if (!lost && !stillInThisGrid) return

    target.focus()
    ref.current?.select()
  })

  // The ring is drawn from what actually holds the keyboard, not from the grid's idea of it.
  // A ring that comes from a state variable can point at a cell the keyboard has left, and
  // has, repeatedly. focus-within cannot: it IS focus.
  // A RING MEANS "THIS CELL IS IN A STATE", AND IT MAY NOT MEAN ANYTHING ELSE.
  //
  // Every editable cell on the cursor row used to draw its own grey ring, to say "this one can
  // be typed into". On a white row it was invisible; the moment the cursor row was tinted, four
  // cells looked like they were in a state and one was. Aj saw it against v2 side by side, and
  // v2 draws exactly one ring — on the focused cell — with the row tint as the only other mark.
  // An error ring arriving on that row was competing with three ornaments for the same meaning,
  // which is this codebase's own rule about a control reporting a state it is not in.
  //
  // WHICH LEAVES TWO RINGS ON THE WHOLE SCREEN, and they are the two states worth having:
  // SQUARE, AND INSET. A rounded ring inside a square cell leaves four slivers of cell showing
  // at the corners, which reads as a control dropped into a table rather than a table you can
  // type in. v2's cells are square and the ring is drawn inside the cell's own edge.
  const shell = `flex h-full items-center overflow-hidden border-r border-stroke last:border-r-0 ${width} ${
    // The cell that is wrong, in v2's own shape: a red ring on a pink fill, with the mark.
    isInvalid ? 'bg-danger-soft ring-1 ring-inset ring-danger' : ''
  } focus-ring-within-inset`

  if (isCursor && column === 'item' && !readOnly) {
    return (
      <div role="gridcell" aria-colindex={2} className={shell}>
        <ItemCell row={row} index={index} invalid={isInvalid} inputRef={ref} />
      </div>
    )
  }

  if (isCursor && editable) {
    return (
      <div role="gridcell" className={shell}>
        {isInvalid ? <InvalidMark /> : null}
        <EditableCell
          ref={ref}
          column={column}
          row={row}
          index={index}
          invalid={isInvalid}
          onType={setCell}
        />
      </div>
    )
  }

  // The gutter holds ONE thing at a time. The row number steps aside exactly when the delete
  // control appears over it — on the row the pointer is on, and on the row the keyboard is on
  // — because two things stacked in one slot is neither of them.
  //
  // ONLY WHEN THERE IS SOMETHING TO STEP ASIDE FOR. An empty row has nothing to delete, so it
  // has no control — and the number was stepping aside for a control that was not there. On a
  // blank invoice the cursor sits on row one, so row one had no number at all while every row
  // under it did. v2 shows 1.
  const hasControl = row.itemId !== null
  const gutterFade = selected ? 'opacity-0' : !hasControl ? '' : onCursorRow ? 'opacity-0' : 'group-hover:opacity-0'
  const gutter = column === 'serial' ? `text-ink-muted ${gutterFade}` : ''

  return (
    <div
      ref={plainRef}
      role="gridcell"
      tabIndex={isCursor ? 0 : -1}
      onMouseDown={(event) => {
        // Without this the browser hands focus to whatever it thinks was clicked — a div it
        // does not consider focusable — which lands on the page body and kills the keyboard.
        event.preventDefault()
        moveTo({ row: index, column })
      }}
      className={`${shell} px-2 ${alignmentOf(column) === 'end' ? 'justify-end' : ''}`}
    >
      <span className={`truncate text-body ${gutter} ${
        column === 'amount' ? 'text-ink-secondary' : ''
      }`}>
        {readOnlyText(row, column, index, facts)}
      </span>
      {isInvalid ? <InvalidMark /> : null}
    </div>
  )
}
