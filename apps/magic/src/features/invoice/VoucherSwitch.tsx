// The title IS the control that changes what this document is.
//
// v2's arrangement, kept: the title and its chevron are one button, the menu lists the types you
// are NOT on as "Switch to X", and picking one carries the party and the items across. There is
// no separate control beside the title, because a second control for the thing the title already
// names is a second place to look.
//
// WHAT WAS HERE BEFORE WAS WORSE THAN NOTHING: a button with no onClick at all, wearing
// `aria-haspopup="menu"` and a hard-coded `aria-expanded={false}`. It announced a menu that could
// not open and reported a state it was never in, which is the one thing this codebase bans
// outright. `aria-expanded` now comes from the state that actually opens the panel.
//
// NO LOSS LINES. v2 prints a grey second line under two of the items — "Drops the invoice
// number", "Drops payment and settlement" — and Aj has chosen to leave them out. Recorded rather
// than argued: what a switch costs is then discovered after it has happened rather than before,
// and if that bites, the two lines are quoted above and putting them back is a one-line change.
//
// ESCAPE AND THE KEYBOARD COMING BACK ARE THE POPOVER'S JOB, not this file's — it already closes
// on Escape and hands focus to whatever opened it, and a journey on the listing menu holds that.
// What is added here is the arrow walk between the items, which a dialog does not owe.

import * as React from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { actionFor } from '../../lib/shortcuts'
import { VOUCHER_TYPES, type VoucherType } from './voucherTypes'

export function VoucherSwitch({ type, onSwitch }: { type: VoucherType; onSwitch: (next: VoucherType) => void }) {
  const button = React.useRef<HTMLButtonElement>(null)
  const menu = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)

  const targets = VOUCHER_TYPES.filter((name) => name !== type)

  // THE FIRST ITEM TAKES THE KEYBOARD, so the arrows have somewhere to start and somebody who
  // opened this from the keyboard is already on a choice. Deferred a frame because the panel is
  // not in the document until the popover has rendered it.
  React.useEffect(() => {
    if (!open) return undefined
    const frame = requestAnimationFrame(() => menu.current?.querySelector('button')?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  // WHICH KEY THIS IS COMES FROM THE ONE TABLE, like every other shortcut in the product. A menu
  // is a list, so it reads the list's own bindings rather than adding a pair of its own — the
  // arrows already mean move-up and move-down there, and the function-key map is untouched.
  function walk(event: React.KeyboardEvent<HTMLDivElement>) {
    const action = actionFor(event, 'list')
    if (action !== 'move-down' && action !== 'move-up') return
    const items = [...(menu.current?.querySelectorAll('button') ?? [])]
    if (items.length === 0) return
    event.preventDefault()
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    // Wraps at both ends, the way v2's does — a menu this short is a ring, not a list you can
    // fall off the bottom of.
    const next = action === 'move-down' ? items[at + 1] ?? items[0] : items[at - 1] ?? items[items.length - 1]
    next?.focus()
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        // THE VISIBLE WORD COMES FIRST. Without a label of its own this button is named by its
        // contents — "Invoice" — which says what the document is and nothing about the fact that
        // pressing it changes that. And a label that dropped the visible word would break the
        // rule that what you SEE on a control has to be in what a screen reader HEARS, so
        // somebody driving by voice can still ask for it by the word in front of them.
        aria-label={`${type} — switch voucher type`}
        title="Switch voucher type"
        onClick={() => setOpen((was) => !was)}
        className="flex items-center gap-1 rounded-control px-1 pressable hover:bg-surface-hover focus-ring"
      >
        <h1 className="text-title font-strong tracking-tight text-ink">{type}</h1>
        <Icon name="chevronDown" className="size-icon-sm text-ink-muted" />
      </button>

      {/* AN EXPLICIT WIDTH, the way the listing's menus set theirs. Sizing to content was tried
          and the panel came out more than twice the width it needed: the items are full-width
          buttons inside a max-content parent, and those two size off each other. The longest item
          is "Switch to Sale Return", and this holds it on one line with room to spare. */}
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label="Change voucher type" align="start">
        <div ref={menu} role="menu" aria-label="Change voucher type" className="w-64 py-1" onKeyDown={walk}>
          {targets.map((name) => (
            // Body weight, which is what the listing's menu items are set in. A menu is a list of
            // things you might do, not a set of headings.
            <Button
              key={name}
              role="menuitem"
              variant="ghost"
              className="w-full justify-start rounded-none px-3 font-body"
              onClick={() => {
                onSwitch(name)
                setOpen(false)
              }}
            >
              Switch to {name}
            </Button>
          ))}
        </div>
      </Popover>
    </>
  )
}
