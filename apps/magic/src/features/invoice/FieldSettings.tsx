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
// IT WRAPS `Label` AND `Popover` RATHER THAN REDRAWING EITHER. Label already knows how a label
// that owns a setting looks and says so to a screen reader; Popover already flips, pulls back
// from the window edge and holds the keyboard. This is the named wrapper that puts the two
// together and holds what is IN it, which is the only way a generic component is allowed onto
// a screen here.

import { useRef, useState } from 'react'

import { Icon } from '@busy/ui/Icon'
import { Label } from '@busy/ui/Label'
import { Popover } from '@busy/ui/Popover'

export type FieldChoice = {
  id: string
  label: string
  /** What it does, in the person's words. Most choices say it in their name and skip this. */
  note?: string
}

export type FieldSettingsProps = {
  /** The words on the label — "Inv No", "Date". Also names the popover. */
  children: string
  choices: readonly FieldChoice[]
  chosen: string
  onChoose: (id: string) => void
  /** The door at the foot. Named for the group it opens, never just "Settings", because a
   * door with no destination on it is a door people do not press twice. */
  onOpenSettings?: () => void
  settingsLabel?: string
}

export function FieldSettings({ children, choices, chosen, onChoose, onOpenSettings, settingsLabel }: FieldSettingsProps) {
  const [open, setOpen] = useState(false)
  // The popover hangs off the LABEL's own box. The span is what carries the ref because Label
  // is a word, not an element this file owns — and the span is exactly the label's shape.
  const anchor = useRef<HTMLSpanElement>(null)

  return (
    // ON THE FIELD'S BORDER, NOT ABOVE IT. v2's treatment, approved as the rule for every field.
    // The label straddles the top stroke and paints the surface behind itself, which breaks the
    // stroke cleanly rather than sitting on a second line and pushing every field down.
    <span
      ref={anchor}
      className="absolute top-0 left-2 z-10 inline-flex -translate-y-1/2 bg-surface px-1"
    >
      <Label
        onOpenSettings={() => setOpen((was) => !was)}
        settingsName={`${children} settings`}
        // WEIGHT 510, NOT BODY. A field label inherited body weight, so the word above the field
        // was drawn LIGHTER than the word inside it — measured at 400 where --weight-label was
        // authored for this and nothing used it.
        className="text-caps font-label uppercase tracking-wide"
      >
        {children}
      </Label>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchor} label={`${children} settings`}>
        <div role="menu" aria-label={`${children} settings`} className="min-w-56 p-1">
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
              className="flex w-full items-start gap-2 rounded-control px-2 py-2 text-left hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus"
            >
              {/* The tick's room is always there, so the words do not shift by an icon when the
                  choice moves — a list that jogs sideways as you press it reads as a mistake. */}
              <span className="w-4 shrink-0 text-ink-accent">
                {choice.id === chosen ? <Icon name="tick" className="size-icon-sm" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-body text-ink">{choice.label}</span>
                {choice.note === undefined ? null : (
                  <span className="block text-sm text-ink-secondary">{choice.note}</span>
                )}
              </span>
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
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-control border-t border-stroke px-2 py-2 text-left text-body text-ink-secondary hover:bg-surface-hover hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus"
            >
              {settingsLabel ?? 'More settings'}
              <Icon name="chevronRight" className="size-icon-sm" />
            </button>
          )}
        </div>
      </Popover>
    </span>
  )
}
