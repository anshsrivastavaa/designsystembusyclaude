// THE NOTCH. A field's label straddles the top stroke and paints the surface behind itself, so
// the stroke breaks cleanly for the word instead of the word sitting on a second line and
// pushing every field down. v2's treatment, approved as the rule for every field on 24-08.
//
// IT IS ONE FILE BECAUSE IT WAS TWO. The party label carried the notch classes on the `Label`
// itself; the number, date and due labels carried them on a wrapper span inside `FieldSettings`.
// Both painted, so both looked right — and that is exactly the trouble: one rule authored twice,
// on two different elements, is one rule that can be half-changed. Measured on the running page
// before this was written, so it is a de-duplication and not a bug fix: all four read
// `rgb(255, 255, 255)` with 4px of side padding.
//
// THE POSITIONING IS ABSOLUTE, SO THE FIELD'S BOX MUST BE RELATIVE. `MetaField` and the party
// column both are. A notch on a static parent lands at the top of the page.

import type { RefObject } from 'react'

import { Label } from '@busy/ui/Label'

export function FieldLabel({
  children,
  onOpenSettings,
  settingsName,
  ref,
}: {
  children: string
  /** Given one, the label becomes the door to what governs the field. Without it, a plain word. */
  onOpenSettings?: () => void
  settingsName?: string
  /** The popover hangs off this span, because it is exactly the label's shape. */
  ref?: RefObject<HTMLSpanElement | null>
}) {
  return (
    <span ref={ref} className="absolute top-0 left-2 z-10 inline-flex -translate-y-1/2 bg-surface px-1">
      <Label
        {...(onOpenSettings === undefined ? {} : { onOpenSettings, settingsName })}
        // WEIGHT 510, NOT BODY. A field label inherited body weight, so the word above the field
        // was drawn LIGHTER than the word inside it — measured at 400 where --weight-label was
        // authored for this and nothing used it.
        className="text-caps font-label uppercase tracking-wide"
      >
        {children}
      </Label>
    </span>
  )
}
