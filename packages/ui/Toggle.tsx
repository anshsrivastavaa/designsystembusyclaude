// A switch that turns something on and off, and does it the moment it is pressed. "Show line
// items" in the listing's Table view is its first use.
//
// A SWITCH, NOT A CHECKBOX, AND THE DIFFERENCE IS WHEN IT TAKES EFFECT. A checkbox states an
// intention that something else later acts on — tick three rows, then press Delete. A switch
// IS the action: the thing it names changes as it moves, with nothing to confirm. Show line
// items expands every invoice the instant it goes on, so it is a switch. If a control ever
// needs an OK button after it, it was a checkbox all along.
//
// NOT THE SAME THING AS Chip, though docs/components.md once described them as one. A Chip is
// a label you read; this is a control you press. They collided because the document called
// the pressable one a chip. One is read, one is pressed, and they are two components.

import * as React from 'react'

import { cn } from './cn'
import { Icon, type IconName } from './Icon'

export type ToggleProps = Omit<React.ComponentProps<'button'>, 'onChange' | 'type'> & {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  /** The words beside the switch. They are part of the control, so pressing them works too. */
  children: React.ReactNode
  /** `track` is the switch with a knob that travels. `icon` is a glyph with its name beneath,
   *  filled when on and outline when off — for a row of switches where each one is a THING
   *  rather than a setting: send it on WhatsApp, print it, email it.
   *
   *  IT IS A VARIANT AND NOT A SECOND COMPONENT, and the reason is the half that matters: the
   *  role, the `aria-checked`, the keyboard and the name are identical. What changes is how on
   *  and off are drawn. A second component would have been a second chance to get the switch
   *  semantics wrong, which is how a control ends up saying "checked" where it should say "on". */
  look?: 'track' | 'icon'
  /** The glyph, for `look="icon"`. Filled is on and outline is off — the same state `filled`
   *  carries on the favourite star, which is the only other place it means anything. */
  icon?: IconName
}

export function Toggle({
  checked,
  onCheckedChange,
  children,
  className,
  disabled,
  look = 'track',
  icon,
  ...props
}: ToggleProps) {
  return (
    <button
      type="button"
      // `switch` rather than `checkbox`: a screen reader then says "on"/"off" rather than
      // "checked", which is the difference the eye is being shown as well.
      role="switch"
      aria-checked={checked}
      disabled={disabled ?? false}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'group rounded-control focus-ring pressable',
        'disabled:cursor-not-allowed disabled:opacity-50',
        look === 'icon'
          ? // A column, so the name sits under the glyph and the whole of it is one target.
            'flex w-16 flex-col items-center gap-1 px-1 py-1.5 text-center text-sm'
          : 'flex items-center gap-3 text-left text-body text-ink',
        // OFF IS QUIETER, NOT HIDDEN. A switch nobody can see the off state of is a switch
        // nobody can tell the state of — the ink steps down, the glyph goes hollow, and both
        // survive the colour being taken away.
        look === 'icon' && (checked ? 'text-ink-accent' : 'text-ink-secondary hover:text-ink'),
        className,
      )}
      {...props}
    >
      {look === 'icon' ? (
        <>
          <Icon name={icon ?? 'star'} filled={checked} className="size-icon-lg" />
          <span className="w-full truncate">{children}</span>
        </>
      ) : (
      <>
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-pill',
          // On is the accent fill; off is a plain sunken track with a border, so the two
          // states differ in shape and weight as well as in colour and survive greyscale.
          checked ? 'bg-accent' : 'border border-stroke-strong bg-surface-sunken',
        )}
      >
        <span
          className={cn(
            'inline-block size-4 rounded-pill bg-surface shadow-raised transition-transform',
            // The knob's travel is what says on or off at a glance, before any colour is read.
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </span>
      {children}
      </>
      )}
    </button>
  )
}
