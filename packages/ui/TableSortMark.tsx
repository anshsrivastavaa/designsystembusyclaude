// Which way a column is sorted, and what a click would do to one that is not.
//
// ONE CHEVRON, NOT A PAIR. Two stacked arrows with one lit is what Ant ships and it is the
// noisiest thing on a table, because it repeats on every heading — seven columns of permanent
// marks saying six of them are not sorted. Primer shows one, and only when it means something.
//
// HIDDEN BY visibility, NOT BY BEING ABSENT, so the space stays reserved and no heading shifts
// sideways the moment you sort it. `invisible` is Tailwind's visibility:hidden; `hidden` would
// take the box away and move the label.
//
// ON HOVER IT PREVIEWS. An unsorted column shows the ASCENDING chevron while the pointer is on
// it, because ascending is what a click will do. It is not decoration: it answers the question
// the pointer is asking.
//
// THE CHEVRON ONLY CONFIRMS — the LABEL carries the state. Heading text sits two grey steps
// down and darkens when its column is sorted, which is a difference you can see across a whole
// header row without hunting for a small mark. That part lives in Table.tsx, on the heading.

import { Icon } from './Icon'
import { cn } from './cn'

export function TableSortMark({ direction }: { direction: 'asc' | 'desc' | undefined }) {
  const sorted = direction !== undefined

  return (
    <Icon
      name="chevronDown"
      className={cn(
        'size-icon-sm shrink-0 transition-opacity',
        // Ascending points up, so the chevron turns over. One glyph, two meanings, no second
        // icon to keep in step with the first.
        direction === 'asc' && 'rotate-180',
        sorted ? 'text-ink' : 'invisible text-ink-muted group-hover/sort:visible',
      )}
    />
  )
}
