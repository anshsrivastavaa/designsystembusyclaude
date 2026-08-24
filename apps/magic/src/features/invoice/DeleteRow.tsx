// Deleting a line from the item grid. The gutter control's look is `DeleteInGutter`; what is
// here is the only part that is this grid's own — which row goes, and where the keyboard lands
// afterwards.

import { flushSync } from 'react-dom'

import { DeleteInGutter } from './DeleteInGutter'
import { useInvoice } from './store'

export function DeleteRow({ index, filled, onCursorRow }: { index: number; filled: boolean; onCursorRow: boolean }) {
  const removeRow = useInvoice((state) => state.removeRow)
  const moveTo = useInvoice((state) => state.moveTo)

  return (
    <DeleteInGutter
      label={`Delete row ${index + 1}`}
      filled={filled}
      // Shown for the pointer on hover, and always on the row the KEYBOARD is on — delete being
      // mouse-only was a fault in its own right.
      reach="on-the-cursor-row"
      onCursorRow={onCursorRow}
      onDelete={() => {
        // The same rule as the charges table: the cursor goes to the row that moves up into this
        // one's place, so the keyboard is never left holding an element that has gone. Both in
        // one beat: the row goes and the cursor lands, before this handler returns. The
        // containment net checks on keyup, so anything deferred is already too late.
        flushSync(() => {
          removeRow(index)
          moveTo({ row: index, column: 'item' })
        })
      }}
    />
  )
}
