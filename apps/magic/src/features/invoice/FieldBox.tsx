// THE FRAME EVERY HEADER FIELD WEARS. One stroke, one radius, one height, and the focus ring on
// the box rather than on the input inside it — because what a person sees is the field, and a
// ring drawn around an input sitting inside a border reads as two rectangles.
//
// IT IS A COMPONENT BECAUSE IT WAS A STRING IN TWO FILES. `DateField` and `HeaderFields` each
// wrote the run out, each with a comment saying it was deliberately written out rather than
// guessed at — which is the same instinct arriving twice and is exactly the duplication the
// drift gate was added to catch. A date field a hair taller than the number beside it is the
// sort of thing nobody reports and everybody sees, and the only way that cannot happen is if
// there is one of it.
//
// `FieldLabel` IS ITS PARTNER, not its child. The label straddles this box's top stroke and is
// absolutely placed, so it needs a positioned ancestor — this one is `relative` for that reason
// and the label may be passed in as a child or placed by the column around it.

import type { ReactNode, RefObject } from 'react'

import { cn } from '@busy/ui/cn'

export function FieldBox({
  children,
  ref,
  className,
}: {
  children: ReactNode
  ref?: RefObject<HTMLDivElement | null>
  /** What the field around it needs — a group name for a hint that shows on hover, a margin.
   * Never the frame itself: that is this file's whole job. */
  className?: string
}) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-control items-center rounded-control border border-stroke bg-surface focus-ring-within-inset',
        className,
      )}
    >
      {children}
    </div>
  )
}
