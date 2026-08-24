// Search, as an icon that opens into a field and pushes the rest of the row along.
//
// AN ICON RATHER THAN A PERMANENT BOX. A box wide enough to type an invoice number into is the
// widest thing in a title row, and it sits there empty almost all of the time — search is
// something you reach for, not something you read. Collapsed, the row has space for whatever
// else it carries; opened, it takes the space it needs and gives it back.
//
// AT THE LEFT END OF ITS GROUP, so opening it pushes the controls beside it rightwards rather
// than shoving them under a primary button. That is the caller's placement, not this file's.
//
// IN packages/ui BECAUSE IT WAS NEVER THE LISTING'S. It lived in features/listing and nothing
// about it is about invoices: a field that opens, closes, and hands its value back is the same
// control on any screen with a list on it. It read the listing's store and the application's
// shortcut table, and BOTH had to leave for it to move — the library may not reach into the
// app, which is a rule this repo gates. So the value comes in as a prop and what a key MEANS
// stays in the app, where lib/shortcuts.ts decides it.
//
// NO MINIMUM NUMBER OF CHARACTERS, and that is the caller's business too — but it is worth
// saying here: the reference build waits for three, so typing an invoice number of "12" finds
// nothing and the screen says there is nothing to find.

import * as React from 'react'

import { Button } from './Button'
import { Icon } from './Icon'
import { TextField } from './TextField'

export type SearchBoxProps = {
  value: string
  onValueChange: (value: string) => void
  /** Open is the CALLER'S state, because a keyboard shortcut somewhere else opens this too. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What is being searched, read out to a screen reader and shown on the closed control. */
  label: string
  placeholder: string
  /** What the OPEN field is called, which is not always what the closed control is called: the
   * button says "Search invoices" and the field can say what it will match on. Left out, the
   * field takes the same name as the button — never the placeholder, which vanishes the moment
   * somebody types and takes the field's name with it. */
  fieldLabel?: string
  /** The shortcut that opens it, printed on the collapsed control's tooltip. */
  shortcut?: string
  /** Keys pressed inside the field. The caller owns what they MEAN: Escape here is "put this
   * away", and only with an empty field does it also mean "stop searching" — a decision that
   * belongs to the one table in the app that decides every key. */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

export function SearchBox({
  value, onValueChange, open, onOpenChange, label, placeholder, fieldLabel, shortcut, onKeyDown,
}: SearchBoxProps) {
  const field = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) field.current?.focus()
  }, [open])

  if (!open) {
    return (
      <Button
        variant="ghost"
        aria-label={label}
        title={shortcut === undefined ? label : `${label}  ( ${shortcut} )`}
        onClick={() => onOpenChange(true)}
      >
        <Icon name="search" />
      </Button>
    )
  }

  return (
    <div className="flex h-control w-72 items-center gap-1 rounded-control border border-stroke bg-surface px-2 focus-ring-within">
      <Icon name="search" className="text-ink-muted" />
      <TextField
        ref={field}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        aria-label={fieldLabel ?? label}
        {...(onKeyDown ? { onKeyDown } : {})}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Close search"
        onClick={() => {
          onValueChange('')
          onOpenChange(false)
        }}
      >
        <Icon name="close" />
      </Button>
    </div>
  )
}
