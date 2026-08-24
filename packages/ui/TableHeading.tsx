// One heading cell, for both tables.
//
// THIS IS THE ONE THAT HAS ALREADY COST US. The listing's heading was moved off muted ink to
// secondary for a measured reason, and the item grid — which draws its own heading inline —
// was never moved with it. Nothing was wrong with either change; there were simply two places
// saying what a column heading looks like, and only one of them was told. Sort marks, row
// heights and the pin affordance will each drift the same way, one at a time, and each drift
// will look like a small oversight rather than the same fault repeating.
//
// UPPERCASE, LETTERSPACED CAPS — ONE TREATMENT FOR BOTH TABLES. Aj's ruling, 24-08, from the two
// drawn side by side at both densities. The listing wore sentence case and the two grids wore
// caps, and both were argued for separately; what decided it was the density switch. At
// comfortable the sentence-case heading grows to 15px and starts WRAPPING — "Invoice / Amount"
// over two lines — while caps grows to 13px and holds one line. A heading that reflows when
// somebody changes density is a heading that moves the row beneath it.
//
// WHERE A HEADING IS TOO WIDE, SHORTEN THE WORD rather than letting it wrap: "Invoice Amount"
// becomes "INVOICE AMT". Caps read as labels, and a label may be abbreviated in a way a sentence
// may not.
//
// THE TRANSFORM IS FORCED ONTO ANY BUTTON INSIDE, and that is not belt-and-braces. Tailwind's
// preflight carries `button { text-transform: none }` — a real fix for a Firefox and Edge bug —
// and a sortable heading wraps its words in a button. So `uppercase` on this cell was inherited
// by nothing that mattered: the computed style on the cell said uppercase while the screen said
// "Date". Every sortable column, which is nearly all of them, silently ignored the ruling. It
// is a selector rather than a value, so no token is being written by hand here.
//
// SECONDARY, NOT MUTED, and the reason is measured rather than felt. The sunken heading went
// deeper on 20-08, and muted on it reads 4.63 against a 4.5 minimum — passing by thirteen
// hundredths, which is the no-headroom pattern this codebase already carries a warning about
// for amber. Secondary reads 6.67 and is still visibly quieter than the sorted column's ink at
// 14.93.
//
// ONE GREY STEP DOWN UNTIL IT IS THE SORTED ONE. The darkening is the state you can see across
// the whole header row without hunting for a small mark; the chevron beside it only confirms
// which way.
//
// IT RENDERS AS A <th> OR AS A PLAIN ELEMENT. The listing is a real table and its headings must
// be table headers or the whole thing stops being a table to a screen reader; the item grid is
// hand-written markup wearing role="grid", where a <th> outside a <tr> is invalid. Same
// polymorphism the resize handle takes, and for the same reason: the two consumers differ in
// what they ARE, not in what this looks like.
//
// EVERYTHING BELOW THE FIRST ROW STAYS SEPARATE. This is the top edge of what the two tables
// share, and it is deliberately the last thing they share.

import * as React from 'react'

import { cn } from './cn'

export type TableHeadingProps = {
  /** `th` for a real table, `div` for markup wearing grid roles. */
  as?: 'th' | 'div'
  /** Darkened, because this is the column the rows are ordered by. */
  sorted?: boolean
  align?: 'start' | 'end'
  /** Sticks to the top of the scroller. The item grid's heading does; a heading inside a
   * popover does not. */
  sticky?: boolean
  /** A shadow while it is actually holding its position — see useStuck. Only meaningful with
   * `sticky`, and only ever true for one of the two. */
  stuck?: boolean
  className?: string
  children?: React.ReactNode
  /** The column engine measures these by id, so it needs the element. */
  ref?: React.Ref<HTMLElement> | undefined
} & Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'className' | 'ref'>

export function TableHeading({
  as = 'th', sorted = false, align = 'start', sticky = true, stuck = false, className, children, ref, ...rest
}: TableHeadingProps) {
  const Element = as

  return (
    <Element
      ref={ref as React.Ref<never>}
      {...(as === 'th' ? { scope: 'col' as const } : { role: 'columnheader' })}
      className={cn(
        'relative border-b border-stroke bg-surface-sunken px-3',
        'text-caps font-strong tracking-wide uppercase [&_button]:uppercase',
        sticky && 'sticky top-0 z-20',
        sorted ? 'text-ink' : 'text-ink-secondary',
        // A SHADOW IN EXACTLY ONE PLACE IN THIS PRODUCT, and only while the heading is actually
        // holding its position. A hairline ring and a very soft blur, which is what Polaris does
        // and the only shadow any of the five systems carries.
        stuck && 'shadow-raised',
        align === 'end' ? 'text-right' : 'text-left',
        className,
      )}
      {...rest}
    >
      {children}
    </Element>
  )
}
