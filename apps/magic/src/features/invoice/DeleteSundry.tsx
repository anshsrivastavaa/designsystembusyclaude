// Deleting a charge. The gutter control's look is `DeleteInGutter`; what is here is this grid's
// own — which row goes, and where the keyboard lands afterwards.
//
// The generated tax rows have no control here at all: their value is the invoice's own
// arithmetic, and a row you cannot type into is a row you cannot delete either.

import { flushSync } from 'react-dom'

import { DeleteInGutter } from './DeleteInGutter'
import { useInvoice } from './store'

export function DeleteSundry({ index, filled }: { index: number; filled: boolean }) {
  const removeSundryRow = useInvoice((state) => state.removeSundryRow)

  return (
    <DeleteInGutter
      label={`Delete charge ${index + 1}`}
      filled={filled}
      reach="on-hover-or-focus"
      onDelete={(button) => {
        // HAND THE KEYBOARD ON BEFORE TAKING THE ROW AWAY. Pressing this removes the element that
        // is holding the keyboard, and nothing else was catching it — focus fell on the page body
        // and the containment net had to put it back, which the fuzz found on press 163. The row
        // that moves up into this one's place is where the person is looking, so that is where
        // the cursor goes; on the last row there is nowhere below, so it goes to the one above.
        //
        // THIS IS WHY THE TWO GRIDS DO NOT SHARE A HAND-OFF. The item grid moves a cursor the
        // store owns; this one has no such cursor and finds the field that took the row's place.
        const table = button.closest('[role="grid"]')
        // flushSync, so the row is GONE and its replacement is on the page before this handler
        // returns. A deferred hand-off — a frame later, or a microtask — is too late: the
        // containment net checks on keyup, which happens between the click and the next frame, so
        // it saw the keyboard on the page body and rescued it first.
        flushSync(() => removeSundryRow(index))
        const names = table?.querySelectorAll<HTMLElement>('[aria-label="Bill sundry"]') ?? []
        names[Math.min(index, names.length - 1)]?.focus()
      }}
    />
  )
}
