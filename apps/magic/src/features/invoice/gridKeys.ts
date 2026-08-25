// What a key means inside the item grid.
//
// OUT OF ItemGrid.tsx, which the 250-line cap said was two things once the column controls
// arrived: a grid that draws itself, and the whole keyboard walk over it. Which key means what
// is still decided in one table for the entire product, in lib/shortcuts.ts; this is only what
// each action DOES here.

import { useCallback } from 'react'

import { enterNeedsNewRow, lastFilledRow, onArrow, onEnter, onTab, type ColumnId } from '../../lib/keyboard'
import { actionFor } from '../../lib/shortcuts'
import { caretIsAt } from './caretAt'
import { useInvoice } from './store'

export function useGridKeys(columns: readonly ColumnId[]) {
  const moveTo = useInvoice((state) => state.moveTo)
  const appendRow = useInvoice((state) => state.appendRow)

  return useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // THE HEADINGS ARE NOT THE GRID. This handler is on the whole grid, and the heading row
      // binds the arrow keys itself — to walk between headings, and with Ctrl to move a column.
      // The resize handle binds them too. Without this, every one of those presses also moved
      // the cursor in the rows underneath, which is one key doing two things at once.
      if (event.target instanceof Element && event.target.closest('[role="columnheader"]') !== null) return

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

      // BARE Home AND End: THE ENDS OF THIS ROW, ON THE SECOND PRESS.
      //
      // The first press belongs to the field. A cell under the cursor is a real input, so Home
      // already means "the front of what I am typing" — and a grid that takes the key outright
      // leaves no way back to the front of a price being retyped. So the caret is asked where it
      // is, and only a caret ALREADY at the end it is being sent to hands the key on.
      //
      // A cell with nothing in it is at both ends at once, which is right: there is no text to
      // walk, so the first press is the one that moves.
      if (action === 'row-start' || action === 'row-end') {
        const toStart = action === 'row-start'
        if (!caretIsAt(document.activeElement, toStart ? 'start' : 'end')) return
        const edge = toStart ? columns[0] : columns[columns.length - 1]
        if (edge === undefined) return
        event.preventDefault()
        moveTo({ row: at.row, column: edge })
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
}
