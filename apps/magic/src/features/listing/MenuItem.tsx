// One row inside one of the listing's popovers. Every menu on this screen uses it, so a menu
// row is the same height, the same padding and the same tick everywhere — the previous build
// grew four menu styles because each menu drew its own rows.
//
// THE TICK IS ALWAYS RESERVED, chosen or not. Without that the labels shift sideways as the
// chosen row changes, and a list that moves under the pointer is a list you mis-click.
//
// A ROW IS A CHOICE OR A COMMAND, AND IT SAYS WHICH. Every row was `menuitemradio` with
// aria-checked, so a screen reader read "Delete, radio button, not checked" — which describes
// a thing you can pick between, not a thing you can do. Delete is not one of a set and there
// is nothing for it to be checked against.

import type * as React from 'react'

import { Icon } from '@busy/ui/Icon'
import { NotBuiltMark } from '@busy/ui/NotBuilt'
import { cn } from '@busy/ui/cn'

export type MenuItemProps = {
  /** `choice` is one of a set and reports whether it is the chosen one. `command` does
   * something when pressed and has no state at all. */
  kind?: 'choice' | 'command'
  chosen?: boolean
  /** Shown to the right in quieter ink — the actual dates under a period, a count, a shortcut. */
  detail?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  /** Off because the PRODUCT does not do this yet, rather than because of anything about the
   * record in front of you. The two look identical without this and lead to opposite next
   * actions — one nobody can act on, one often fixable. */
  notBuilt?: boolean
  /** Why it is off. Nothing is disabled without saying why. */
  reason?: string
  children: React.ReactNode
}

export function MenuItem({ kind = 'choice', chosen = false, detail, onClick, disabled = false, notBuilt = false, reason, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role={kind === 'choice' ? 'menuitemradio' : 'menuitem'}
      {...(kind === 'choice' ? { 'aria-checked': chosen } : {})}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? reason : undefined}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-body',
        'focus-visible:bg-surface-hover focus-visible:outline-none pressable',
        'disabled:cursor-not-allowed disabled:opacity-50',
        disabled ? '' : 'hover:bg-surface-hover',
        chosen ? 'font-label text-ink-accent' : 'text-ink',
      )}
    >
      {/* Space held on a choice whether or not it is the chosen one, and not held at all on a
          command — a command has nothing to tick, so an empty column beside it is a column of
          nothing. */}
      {kind === 'choice' ? (
        <Icon name="chevronRight" className={cn('size-icon-md', chosen ? 'rotate-90' : 'invisible')} />
      ) : null}
      {/* The one mark that says "a gap in the product" rather than "a fact about this record".
          It sits before the words, where the eye already is on the way into the row. */}
      {notBuilt ? <NotBuiltMark /> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {detail === undefined ? null : <span className="shrink-0 text-sm text-ink-muted">{detail}</span>}
    </button>
  )
}

/** The heading above a group of rows inside a menu. */
export function MenuHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="px-3 pt-2 pb-1 text-sm font-label text-ink-muted">{children}</h3>
}

/** A link-looking row at the foot of a menu that opens something bigger. */
export function MenuFooterAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full shrink-0 items-center justify-between gap-2 border-t border-stroke px-3 py-2',
        'text-body font-label text-ink-accent hover:bg-surface-hover',
        'focus-visible:bg-surface-hover focus-visible:outline-none pressable',
      )}
    >
      {children}
      <Icon name="chevronRight" className="size-icon-md" />
    </button>
  )
}
