// The delete control that sits in a grid's left gutter. ONE LOOK, TWO GRIDS.
//
// WHY THE LEFT. It sat beside Amount until 20-08. The money columns are what the eye scans down
// a long invoice, and a red block landing in that column interrupts the one run of figures that
// has to stay calm. In the gutter it is beside the row's number, where nothing is being read.
//
// ONE SLOT, AND WHAT IS IN IT IS DECIDED BY MODE, NEVER BY HOVER. The gutter holds the row
// number at rest and this on the row you are on — the one row whose number you do not need to
// read, because you are standing on it. If row selection ever arrives, every row's slot holds a
// tick for as long as selection is on, and delete leaves the gutter entirely: deleting one row
// while a bulk bar is open is the same action with a count of one, and it belongs in that bar.
//
// IT IS RED, AND THAT IS ON TRIAL. Deleting a row is one of the commonest things a wholesale
// user does on a two-thousand-row invoice, and this repository's rule is that colour is for
// exceptions — a red control on a routine action spends the alarm colour on the least alarming
// thing in the product. The CEO asked for it, Aj wants it seen rather than argued about, and it
// comes out whole if the CEO agrees. One file now, so it comes out of one place.
//
// It uses --color-danger-fill, not --color-danger: the latter is a text stop and reads maroon as
// a fill.
//
// WHY A BASE AND TWO WRAPPERS RATHER THAN ONE COMPONENT. DeleteSundry's header used to claim the
// two grids "cannot share one component". They can share the LOOK, which is all of the above and
// is the part that must not drift. What they genuinely do not share is REACH and the hand-off
// after the row goes — the item grid moves its cursor through the store, the sundry grid finds
// the field that took the row's place in the DOM. Folding those together would have quietly
// changed one grid's keyboard behaviour to match the other's, so each keeps its own in a named
// wrapper and only the face lives here.

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'

/** How the control can be reached, which is the one thing the two grids answer differently. */
export type Reach =
  /** Visible and tabbable ONLY on the row the keyboard is on, hidden from assistive software
   * everywhere else. A control you cannot see is one Tab must not stop at — it did, and the
   * keyboard went nowhere. */
  | 'on-the-cursor-row'
  /** Always in the tab order, appearing on hover and when it takes focus. */
  | 'on-hover-or-focus'

export function DeleteInGutter({
  label,
  filled,
  reach,
  onCursorRow = false,
  onDelete,
}: {
  label: string
  filled: boolean
  reach: Reach
  onCursorRow?: boolean
  onDelete: (button: HTMLButtonElement) => void
}) {
  // Nothing to delete on a padding row, and a control that does nothing is worse than none.
  if (!filled) return null

  const byCursor = reach === 'on-the-cursor-row'
  const hidden = byCursor && !onCursorRow

  return (
    <Button
      size="icon-sm"
      className={`bg-danger-fill text-on-accent ${
        byCursor
          ? onCursorRow
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100'
          : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
      }`}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden ? true : undefined}
      aria-label={label}
      onClick={(event) => onDelete(event.currentTarget)}
    >
      <Icon name="trash" />
    </Button>
  )
}
