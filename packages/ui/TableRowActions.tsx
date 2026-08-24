// The buttons that belong to one row of a Table, and the layer they live in.
//
// ITS OWN FILE BECAUSE IT IS ITS OWN THING. The table owns rows, columns and selection; this
// owns the small floating surface that follows whichever row is being pointed at or typed at.
// It came out of Table.tsx when that file went past 250 lines, which is the check saying the
// file had become two things — and it had.

import type * as React from 'react'

import { cn } from './cn'

/** The buttons for one row. The cell is narrow and holds them right; they overflow leftwards
 * over the last column, on their own background so the figures underneath do not show
 * through. Sticky, so they stay at the visible right edge however far the table is scrolled.
 *
 * `as` EXISTS BECAUSE THE ITEM GRID IS NOT A <table>. The listing draws real table markup and
 * this has to be a `<td>` or the row is invalid; the invoice's item grid is built out of divs,
 * where a `<td>` is equally invalid and the browser reparents it out of the row entirely. Same
 * behaviour, same sticky edge, two containers — which is a variant, not a second component. */
export function TableRowActions({ as = 'td', children }: { as?: 'td' | 'div'; children: React.ReactNode }) {
  const Container = as

  return (
    <Container className="sticky right-0 border-b border-stroke bg-inherit">
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex items-center gap-1 rounded-control bg-inherit pr-2 pl-3',
          // Out of sight until the row is hovered or something in it has the keyboard. Both
          // triggers, because a hover-only control cannot be reached without a mouse at all.
          'pointer-events-none opacity-0 transition-opacity',
          'group-hover:pointer-events-auto group-hover:opacity-100',
          'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
        )}
      >
        {children}
      </div>
    </Container>
  )
}
