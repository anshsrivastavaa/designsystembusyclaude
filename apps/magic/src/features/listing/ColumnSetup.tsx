// The listing's column setup: the shared ColumnList, told which columns this screen has.
//
// A NAMED WRAPPER, because a generic list is never dropped straight onto a screen. What differs
// between this table and the item grid is which columns exist, what they are grouped under and
// which cannot be turned off — all data, all handed in. The shape of the list is the same on
// both, and that is the part that would otherwise be written twice.
//
// THREE DOORS, ONE POPOVER. The control in the table's top-right corner, a right-click on any
// heading — which is what v2 does on both its tables — or Table view → Column setup. The
// right-click is the fast one and the menu is the discoverable one; they open the same thing,
// so neither is a lesser version.
//
// A PER-COLUMN MENU LIVED HERE FOR ONE COMMIT AND WAS WRONG. The fault it was solving is real:
// a right-click on a SPECIFIC heading that ignores which heading you clicked reports a state it
// is not in. But the fix was to give the per-column action its own affordance — the pin on the
// heading — rather than to make this list one step further away from three doors that already
// worked. Aj's ruling.
//
// GROUPED, because the list is eighteen long once the document's full set is in it, and
// eighteen ticks in one column is a list nobody reads to the end.
//
// PINNED COLUMNS SAY SO, and the stack position only when there IS a stack. A list of ticks
// where some entries are frozen and none of them look it is the same fault; and Unpin all
// cannot be found if nothing says there is anything to unpin.

import type * as React from 'react'

import { ColumnList, type ColumnListItem } from '@busy/ui/ColumnList'
import { COLUMNS_WAITING, COLUMN_GROUPS, GROUP_OF, LOCKED_COLUMNS, listingColumns } from './columns'
import { useListing } from './store'

export function ColumnSetup({
  open, onClose, anchorRef, at,
}: {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  /** Where the right-click was, when it came from one. */
  at?: { x: number; y: number }
}) {
  const hidden = useListing((state) => state.hiddenColumns)
  const today = useListing((state) => state.today)
  const toggleColumn = useListing((state) => state.toggleColumn)
  const pins = useListing((state) => state.columnPins)
  const unpinEveryColumn = useListing((state) => state.unpinEveryColumn)

  /** Where a column is frozen, and where it sits in the stack against that edge. Two columns
   * pinned left is the common case — the row's identity — so the order is worth showing. */
  const pinnedAt = (id: string): ColumnListItem['pinnedAt'] => {
    const start = pins.start.indexOf(id)
    if (start !== -1) return { side: 'left', place: start + 1, of: pins.start.length }
    const end = pins.end.indexOf(id)
    if (end !== -1) return { side: 'right', place: end + 1, of: pins.end.length }
    return undefined
  }

  const items: ColumnListItem[] = [
    ...listingColumns(today).map((column) => {
      const pinned = pinnedAt(column.id)
      return {
        id: column.id,
        header: column.header,
        group: GROUP_OF[column.id] ?? COLUMN_GROUPS[0],
        ...(LOCKED_COLUMNS.includes(column.id) ? { locked: true } : {}),
        ...(pinned ? { pinnedAt: pinned } : {}),
      }
    }),
    // Asked for by the product document, answerable by no field the invoice carries. Shown and
    // switched off, each saying what it waits on — omitting them would make a third of the list
    // look like the whole of it.
    ...COLUMNS_WAITING.map((column) => ({
      id: `waiting-${column.header}`,
      header: column.header,
      group: column.group,
      waitingOn: column.needs,
    })),
  ]

  return (
    <ColumnList
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      {...(at ? { at } : {})}
      groups={COLUMN_GROUPS}
      items={items}
      hidden={hidden}
      onToggle={toggleColumn}
      onUnpinAll={unpinEveryColumn}
    />
  )
}
