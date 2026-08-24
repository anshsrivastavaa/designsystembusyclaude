// The one treatment for the words beside a control.
//
// It exists because there were three. "Billed to" was a paragraph in the party header, the new
// -party drawer wrote its own span, and the party details panel wrote a third — same size, same
// ink, three places to change and three chances to drift. One idea, one component.
//
// IT IS ALSO WHERE SETTINGS HANG OFF. A label that OWNS a setting is a control: pressing it
// opens what governs that field — the numbering series behind "Invoice no.", the terms behind
// "Due date". That is the pattern rather than a gear beside every field, because a row of gears
// is a row of the same icon meaning six different things. A plain label stays a plain label:
// nothing about it invites a press it will not answer.

import type * as React from 'react'

import { cn } from './cn'

export type LabelProps = {
  children: React.ReactNode
  /** What this label opens, when it owns a setting. Given one, the label becomes a button and
   * says so; without one it is a plain word and takes no focus. */
  onOpenSettings?: () => void
  /** Named for the screen reader, since "Due date" alone does not say that pressing it opens
   * anything. Required alongside the handler so it can never be forgotten. */
  settingsName?: string
  className?: string
  htmlFor?: string
}

const WORDS = 'text-sm text-ink-secondary'

export function Label({ children, onOpenSettings, settingsName, className, htmlFor }: LabelProps) {
  if (onOpenSettings === undefined) {
    return (
      <label htmlFor={htmlFor} className={cn(WORDS, className)}>
        {children}
      </label>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      aria-label={settingsName}
      className={cn(
        WORDS,
        // UNDERLINED ONLY ON HOVER AND FOCUS. A dotted underline on every settings label turns
        // the header into a page of links; nothing here is a link, and the ones that open
        // something are found by trying, which is what a label that reacts is for.
        'rounded-control text-left hover:underline focus-visible:underline',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-stroke-focus',
        className,
      )}
    >
      {children}
    </button>
  )
}
