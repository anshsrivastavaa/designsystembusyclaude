// A small label that says what state a record is in. The Status cell on the invoice listing
// is its first use: Pending, Overdue, On Acc, Hold, Cancelled, Paid.
//
// IT IS NOT A CONTROL, AND IT MUST NOT BECOME ONE. docs/components.md describes a different
// Chip — "a small lit or unlit control showing a state that will apply on save" — which is a
// toggle you press. That thing is not built. If it arrives, it is a separate control with its
// own name, because a label you read and a button you press are two things and a component
// that is both is the component that does everything. Flagged to Aj on 20-08.
//
// THE WORD CARRIES THE MEANING, NEVER THE COLOUR. Every chip prints its label, and the tone
// only tints what is already legible. Roughly one man in twelve has red-green colour
// deficiency, and a listing where Overdue is "the red one" tells him nothing. Take the colour
// out and the screen still reads — that is the test this component is built to pass.

import * as React from 'react'

import { cn } from './cn'

/** What the state MEANS, never what it looks like. The theme decides the colour. */
export type ChipTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type ChipProps = React.ComponentProps<'span'> & {
  tone?: ChipTone
}

// Soft fill with full-strength ink, so the chip reads as a quiet label rather than a button.
// Neutral is the default and the commonest: most states are not exceptional, and a listing
// where every row is tinted has no tint left for the row that needs chasing.
const TONES: Record<ChipTone, string> = {
  neutral: 'bg-surface-sunken text-ink-secondary',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export function Chip({ tone = 'neutral', className, children, ...props }: ChipProps) {
  return (
    <span
      data-slot="chip"
      className={cn(
        'inline-flex items-center gap-1 rounded-control px-2 py-0.5',
        'text-sm font-label whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
