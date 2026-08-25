// Taking one row out of a list inside a drawer. ONE LOOK, EVERY SUCH LIST.
//
// IT IS NOT `DeleteInGutter`, which is the red block in a grid's left gutter. That one is loud on
// purpose and is on trial for it; this is the opposite case — a row in a short list a person is
// already working through, where removing one is ordinary and the control should not shout.
//
// IT TOOK ITS OWN FILE BECAUSE A GATE SAID SO, and the gate was right: the same class run appeared
// in the held-invoice chooser and in the split drawer within a day of each other, which is two
// places drawing one thing just before they part.
//
// QUIET UNTIL IT IS REACHED FOR, and red only then. Colour is for exceptions in this product, and
// a row of trash cans down a list makes removing look like the thing the list is for.

import { Icon } from '@busy/ui/Icon'

export function RemoveFromList({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onRemove}
      className="rounded-control p-1 text-ink-muted hover:text-danger focus-ring"
    >
      <Icon name="trash" className="size-icon-sm" />
    </button>
  )
}
