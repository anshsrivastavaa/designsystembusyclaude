// A section that folds away: a word, a chevron that turns over, and whatever is under it.
//
// FOUR OF THESE WERE WRITTEN SEPARATELY — the breakdown, the tax summary, the narration and the
// drawer's extra fields — and the fifth was about to be, in a folder that cannot import any of
// the first four. That is the dependency rule pointing at where the thing belongs, which is
// here. All four already agree on the shape, so this is a consolidation and not a new design:
// `Narration.tsx` records it as v2's, kept — a chevron and the word, the chevron turning over
// when it opens.
//
// ONE OF THE FOUR WAS A <details> ELEMENT and the other three were buttons. That is not a
// stylistic difference: a native <details> cannot be animated open, cannot be controlled from
// outside, and its <summary> takes a click on the whole strip including any control sitting in
// it. Everything here is a button with `aria-expanded`, which is what the other three had
// already arrived at independently.
//
// CONTROLLED OR NOT, AND WHY BOTH. Three of the four keep their own state; the breakdown starts
// open and something outside it may one day want to close it. Passing `open` makes it
// controlled, leaving it out keeps its own — the same arrangement `TopMenu` uses, for the same
// reason, so there is one answer to this question in the codebase rather than two.

import * as React from 'react'

import { cn } from './cn'
import { Icon } from './Icon'

export type DisclosureProps = {
  /** What sits beside the chevron. A string in every case so far; a node because one of the
   *  four puts a count after the word and there is no reason to make it re-implement the row. */
  summary: React.ReactNode
  /** The accessible name, when `summary` is not a plain string or when it should read as an
   *  instruction rather than a label — "Hide the breakdown" rather than "Breakdown". */
  label?: string
  /** Shown on the right of the header ONLY while it is closed. The narration puts the first few
   *  words of the note here, so a folded section is not a section you have to open to check. */
  closedAside?: React.ReactNode
  /** Its state when it first appears, for the uncontrolled case. */
  defaultOpen?: boolean
  /** Passing this makes it controlled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Ink for the header. `accent` is the drawer's "more fields" link, which reads as a way in
   *  rather than as a heading; `heading` is the other three. */
  tone?: 'heading' | 'accent'
  children: React.ReactNode
  className?: string
}

export function Disclosure({
  summary,
  label,
  closedAside,
  defaultOpen = false,
  open: given,
  onOpenChange,
  tone = 'heading',
  children,
  className,
}: DisclosureProps) {
  const [own, setOwn] = React.useState(defaultOpen)
  const open = given ?? own

  const toggle = () => {
    if (given === undefined) setOwn(!open)
    onOpenChange?.(!open)
  }

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        {...(label === undefined ? {} : { 'aria-label': label })}
        onClick={toggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-control px-3 py-2 text-left',
          'text-sm font-strong hover:bg-surface-hover focus-ring',
          tone === 'accent' ? 'text-ink-accent' : 'text-ink-secondary hover:text-ink',
        )}
      >
        {/* THE CHEVRON TURNS, IT IS NOT SWAPPED FOR A SECOND ICON. One glyph rotating says the
            same thing is still there and has changed state; two glyphs say two different things.
            It also animates, which the four hand-written copies did not — a mark that jumps
            through 180 degrees reads as a redraw rather than as the thing you just did. */}
        <Icon
          name="chevronDown"
          className={cn('transition-transform duration-swift ease-settle', open ? 'rotate-180' : '')}
        />
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        {open || closedAside === undefined ? null : (
          <span className="min-w-0 truncate text-sm font-body text-ink-muted">{closedAside}</span>
        )}
      </button>

      {/* NOT RENDERED WHILE CLOSED, rather than rendered and hidden. The build this one is named
          after had seven fields that were never hidden while every test asked whether the hiding
          CLASS was present — so a closed section here has nothing in the markup to be wrong
          about, and a test that asks for its contents gets an honest nothing. */}
      {open ? <div className="px-3 pb-2">{children}</div> : null}
    </div>
  )
}
