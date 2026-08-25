// The item grid's column setup: the shared ColumnList, told which columns this grid has.
//
// A NAMED WRAPPER, because a generic list is never dropped straight onto a screen. What differs
// from the listing is which columns exist, what they are grouped under and which cannot be
// turned off — all data, all handed in. The shape of the list is the same on both, and that is
// the part that would otherwise be written twice.
//
// TWO DOORS: the control in the heading row's right corner, and a right-click on any heading,
// which is what v2 does on both its tables. The right-click is the fast one and the button is
// the discoverable one; they open the same thing, so neither is a lesser version.
//
// ONLY FIVE OF THE THIRTEEN CAN BE TURNED OFF, and the other eight wear a padlock rather than
// vanishing. A list that showed five entries would read as the whole of what the grid has.
//
// THE TAX COLUMNS ARE NOT IN THE LIST AT ALL WHEN THE COMPANY BILLS BILL-WISE. They are not
// switched off in that mode, they do not exist — tax arrives as a charge instead — and a
// padlocked "Tax %" would be a control reporting a state it is not in.

import type * as React from 'react'

import { ColumnList, type ColumnListItem } from '@busy/ui/ColumnList'
import type { ColumnId } from '../../lib/keyboard'
import { COLUMN_GROUPS, HEADINGS, isOptional, type OptionalColumn } from './gridColumns'
import { useGridLayout } from './gridLayout'

export function GridColumnSetup({
  open, onClose, anchorRef, at, columns, shown, onSetColumn,
}: {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  /** Where the right-click was, when it came from one. */
  at?: { x: number; y: number }
  /** Every column this tax mode CAN show, on or off, in the order they would sit. */
  columns: readonly ColumnId[]
  shown: Record<OptionalColumn, boolean>
  onSetColumn?: (id: OptionalColumn, on: boolean) => void
}) {
  const pins = useGridLayout((state) => state.pins)
  const unpinAll = useGridLayout((state) => state.unpinAll)

  /** Where a column is frozen, and where it sits in the stack against that edge. The row's
   * identity — the number and the item name — is the common freeze, so the order is worth
   * showing; one column alone reads its side and nothing else. */
  const pinnedAt = (id: string): ColumnListItem['pinnedAt'] => {
    const start = pins.start.indexOf(id)
    if (start !== -1) return { side: 'left', place: start + 1, of: pins.start.length }
    const end = pins.end.indexOf(id)
    if (end !== -1) return { side: 'right', place: end + 1, of: pins.end.length }
    return undefined
  }

  const items: ColumnListItem[] = columns.map((column) => {
    const pinned = pinnedAt(column)
    return {
      id: column,
      header: HEADINGS[column],
      group: COLUMN_GROUPS[0],
      ...(isOptional(column) ? {} : { locked: true }),
      ...(pinned ? { pinnedAt: pinned } : {}),
    }
  })

  // OFF IS "OPTIONAL AND NOT SWITCHED ON". The list works out its own ticks from `hidden`, and
  // a locked column is drawn ticked whatever this says — so only the five that can move need
  // an answer here.
  const hidden = (Object.keys(shown) as OptionalColumn[]).filter((id) => !shown[id])

  return (
    <ColumnList
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      {...(at ? { at } : {})}
      groups={COLUMN_GROUPS}
      items={items}
      hidden={hidden}
      onToggle={(id) => {
        if (!isOptional(id as ColumnId)) return
        const column = id as OptionalColumn
        onSetColumn?.(column, !shown[column])
      }}
      onUnpinAll={unpinAll}
    />
  )
}
