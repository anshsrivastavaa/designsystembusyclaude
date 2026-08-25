// A header field's LABEL IS A DOOR, and this is what is behind it.
//
// v2's pattern, and the reason it exists: an invoice header has a dozen optional behaviours —
// which series, whether the date carries over, whether the due date follows bill-by-bill — and
// every one of them, given a control on the screen, would be a control on the screen forever
// for the sake of the day somebody changes it. So the optional lives on the label, one press
// from the field it governs, and the field itself stays a field.
//
// A MARK ON THE LIVE ONE, not a row of radios. The popover is a short list of what this field
// can be and a mark against what it is, which is a menu — and v2 puts a door at its foot so
// the full drawer is one step away rather than a thing you have to remember exists.
//
// THE ROWS ARE `MenuRow` NOW, AND THE MARK CHANGED WITH THEM. This file drew its own rows with
// its own tick while the listing's three menus drew theirs with a rotated chevron — one idea,
// two shapes, and the drift gate saw nothing because it only catches byte-identical class runs.
// Adopting makes the product show ONE mark in four places instead of two marks in four, which is
// what turns "which mark" from an argument into a one-line change in one file.
// **The mark that should win is the tick, and it is filed on packages/ui in `docs/owed.md`.**
// v2 marks the chosen row of its own view menu with a tick, Apple's menus use a checkmark for the
// selected item of a group, and a chevron pointing down reads as "this opens" rather than "this
// is the one". Held here as a comment rather than as a local override, because a fifth shape is
// the fault arriving again.
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

import { MenuFooterAction, MenuRow } from '@busy/ui/MenuRow'
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
            <MenuRow
              key={choice.id}
              chosen={choice.id === chosen}
              onClick={() => {
                onChoose(choice.id)
                setOpen(false)
              }}
            >
              {choice.label}
            </MenuRow>
          ))}

          {onOpenSettings === undefined ? null : (
            <MenuFooterAction
              onClick={() => {
                setOpen(false)
                onOpenSettings()
              }}
            >
              Settings
            </MenuFooterAction>
          )}
        </div>
      </Popover>
    </>
  )
}
