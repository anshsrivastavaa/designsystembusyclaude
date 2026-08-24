// A header field's LABEL IS A DOOR, and this is what is behind it.
//
// v2's pattern, and the reason it exists: an invoice header has a dozen optional behaviours —
// which series, whether the date carries over, whether the due date follows bill-by-bill — and
// every one of them, given a control on the screen, would be a control on the screen forever
// for the sake of the day somebody changes it. So the optional lives on the label, one press
// from the field it governs, and the field itself stays a field.
//
// A TICK ON THE LIVE ONE, not a row of radios. The popover is a short list of what this field
// can be and a mark against what it is, which is a menu — and v2 puts a door at its foot so
// the full drawer is one step away rather than a thing you have to remember exists.
//
// NO SECOND LINE ON A CHOICE, AND THE FOOT SAYS ONLY "SETTINGS". Ruled by Aj on 24-08, and it
// overturns what was written here before — that the door should be named for the group it
// opens. Two things were wrong with the old shape at once. The grey sentence under Export and
// Retail was the standing no-subtext rule broken in the one place a rule is easiest to break,
// inside a panel; and it was also what made the panel wide, because a menu is as wide as its
// longest line and its longest line was a sentence. Naming the door "All series & numbering"
// then made the FOOT the longest line instead, so the panel stayed wide after the sentences
// went. One word, in every one of these popovers, is what makes them the same object.
//
// IT WRAPS `Label` AND `Popover` RATHER THAN REDRAWING EITHER. Label already knows how a label
// that owns a setting looks and says so to a screen reader; Popover already flips, pulls back
// from the window edge and holds the keyboard. This is the named wrapper that puts the two
// together and holds what is IN it, which is the only way a generic component is allowed onto
// a screen here.

import { useRef, useState } from 'react'

import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { FieldLabel } from './FieldLabel'

/** One thing this field can be. A choice is its own explanation — if a name needs a sentence
 * under it the name is wrong, and the sentence is subtext this product does not have. */
export type FieldChoice = {
  id: string
  label: string
}

export type FieldSettingsProps = {
  /** The words on the label — "Inv No", "Date". Also names the popover. */
  children: string
  choices: readonly FieldChoice[]
  chosen: string
  onChoose: (id: string) => void
  /** The door at the foot, and it always reads "Settings". */
  onOpenSettings?: () => void
}

export function FieldSettings({ children, choices, chosen, onChoose, onOpenSettings }: FieldSettingsProps) {
  const [open, setOpen] = useState(false)
  // The popover hangs off the LABEL's own box. The span is what carries the ref because Label
  // is a word, not an element this file owns — and the span is exactly the label's shape.
  const anchor = useRef<HTMLSpanElement>(null)

  return (
    // THE NOTCH IS `FieldLabel`, WHICH IS ALSO WHAT THE PARTY LABEL IS. It was written out here
    // and again in PartyHeader — one rule on two different elements. What this file adds is the
    // popover behind it, which is the only thing that is this file's business.
    <>
      <FieldLabel ref={anchor} onOpenSettings={() => setOpen((was) => !was)} settingsName={`${children} settings`}>
        {children}
      </FieldLabel>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchor} label={`${children} settings`}>
        {/* AS WIDE AS ITS LONGEST WORD, with a floor so a list of short words is not a sliver.
            It was min-w-56, which was the floor a panel of sentences needed and is now
            a third again wider than anything in it. */}
        <div role="menu" aria-label={`${children} settings`} className="min-w-40 p-1">
          {choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              role="menuitemradio"
              aria-checked={choice.id === chosen}
              onClick={() => {
                onChoose(choice.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left hover:bg-surface-hover focus-ring-inset"
            >
              {/* The tick's room is always there, so the words do not shift by an icon when the
                  choice moves — a list that jogs sideways as you press it reads as a mistake. */}
              <span className="w-4 shrink-0 text-ink-accent">
                {choice.id === chosen ? <Icon name="tick" className="size-icon-sm" /> : null}
              </span>
              <span className="min-w-0 truncate text-body text-ink">{choice.label}</span>
            </button>
          ))}

          {onOpenSettings === undefined ? null : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onOpenSettings()
              }}
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-control border-t border-stroke px-2 py-2 text-left text-body text-ink-secondary hover:bg-surface-hover hover:text-ink focus-ring-inset"
            >
              Settings
              <Icon name="chevronRight" className="size-icon-sm" />
            </button>
          )}
        </div>
      </Popover>
    </>
  )
}
