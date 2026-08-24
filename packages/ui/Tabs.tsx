// The status strip on the invoice listing: All, Pending, Overdue, On Acc, Hold. One is always
// chosen, each carries how many rows it would leave, and choosing one narrows the list below.
//
// IT LOOKS LIKE TABS AND IT IS A RADIO GROUP. The reference build marks these role="tab" with
// aria-selected, and there is no tabpanel anywhere on the screen — the list underneath is
// narrowed by six other things as well, so it is nobody's panel. A tab that announces a panel
// it does not have is a control reporting a state it is not in. What this actually is, is one
// choice out of five, which is a radio group: arrow keys move between the options, Tab enters
// and leaves the whole group as one stop, and the chosen one is the only one in the tab order.
// The name stays Tabs because that is the shape on the screen and the name we agreed.
//
// THE COUNT IS PART OF THE OPTION, NOT A DECORATION. It is what makes the strip worth having:
// you can see there are four overdue before you spend a click finding out.

import * as React from 'react'

import { cn } from './cn'

export type TabOption<Value extends string> = {
  value: Value
  /** The words. Always present, even when nothing is drawn from them — with `icon` set they
   * become the accessible name and the tooltip, which is what keeps an icon-only control
   * answerable to a screen reader and to somebody hovering it. */
  label: string
  /** Drawn instead of the words. Density is the one control in this product that takes it: two
   * pictures of the same rows, packed tighter or looser. The case AGAINST it is written down in
   * recorded rather than argued away — density is met once rather than constantly,
   * it has no conventional icon, and the person who needs Large is the least likely to hunt. */
  icon?: React.ReactNode
  /** How many rows this option would leave. Undefined means the count is not known yet, and
   * nothing is drawn — a count of zero and a count nobody has worked out are different. */
  count?: number
}

export type TabsProps<Value extends string> = {
  options: TabOption<Value>[]
  value: Value
  onChange: (value: Value) => void
  /** What the group as a whole is choosing. Read out before the option. */
  label: string
}

export function Tabs<Value extends string>({ options, value, onChange, label }: TabsProps<Value>) {
  const strip = React.useRef<HTMLDivElement>(null)

  // Arrow keys move the choice, which for a radio group also moves the keyboard with it —
  // the two are the same act, not a highlight you then confirm.
  function onKeyDown(event: React.KeyboardEvent) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (step === 0) return
    event.preventDefault()

    const at = options.findIndex((option) => option.value === value)
    const next = options[(at + step + options.length) % options.length]
    if (!next) return
    onChange(next.value)

    // Move the keyboard onto the option that is now chosen. Deferred to the next frame
    // because the button that should take it does not have tabindex 0 until the parent has
    // re-rendered with the new value.
    requestAnimationFrame(() => {
      strip.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus()
    })
  }

  return (
    <div
      ref={strip}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      // inline-flex, so the strip is as wide as its options. As a block-level flex it
      // stretched to whatever contained it, and the tray ran on past Hold to the edge of
      // the toolbar — which reads as an empty sixth option.
      className="inline-flex items-center gap-1 rounded-control bg-surface-sunken p-1"
    >
      {options.map((option) => {
        const chosen = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            data-value={option.value}
            aria-checked={chosen}
            // Only the chosen one is a tab stop. Tab passes over the whole strip in one
            // press, which is the point of a group — five presses to get past a filter is
            // five presses nobody wants on the way to the table.
            tabIndex={chosen ? 0 : -1}
            onClick={() => onChange(option.value)}
            {...(option.icon === undefined ? {} : { 'aria-label': option.label, title: option.label })}
            className={cn(
              'flex h-control-sm items-center gap-2 rounded-control',
              option.icon === undefined ? 'px-3' : 'px-2',
              'text-body font-label whitespace-nowrap transition-colors',
              'focus-ring',
              chosen ? 'bg-surface text-ink shadow-raised' : 'text-ink-secondary hover:bg-surface-hover hover:text-ink',
            )}
          >
            {option.icon ?? option.label}
            {option.count === undefined ? null : (
              <span className={cn('text-sm', chosen ? 'text-ink-secondary' : 'text-ink-muted')}>{option.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
