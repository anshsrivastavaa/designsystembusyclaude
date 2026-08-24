// Which financial year the books are open in.
//
// Its own control beside the company, because this is the one people move constantly — look
// something up in last year's books, come straight back — while the company for most people
// never changes at all. See CompanyMenu.tsx for the ruling.
//
// The year runs April to March, which is India's, and it is why the label is a pair of years
// rather than one.

import { Icon } from '@busy/ui/Icon'
import { NotBuiltNote } from '@busy/ui/NotBuilt'
import { Popover } from '@busy/ui/Popover'
import * as React from 'react'

import { MenuLine } from './MenuLine'

/** The open year, and the two behind it. Until a company screen exists this is the mock world's
 * answer; the shape — newest first, then a way to start the next one — is v2's. */
const OPEN = 'FY 26-27'
const YEARS = ['FY 2026-27', 'FY 2025-26', 'FY 2024-25']

export function YearMenu() {
  const button = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((was) => !was)}
        className="flex h-control-sm shrink-0 items-center gap-1 rounded-control bg-surface-sunken px-2 hover:bg-surface-hover focus-ring"
      >
        <span className="text-sm text-ink-secondary">{OPEN}</span>
        <Icon name="chevronDown" className="size-icon-sm text-ink-muted" />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label="Financial year">
        <div className="w-52 py-1">
          {/* Every line here is unavailable, so it is said once rather than on each. */}
          <NotBuiltNote />
          <div className="border-t border-stroke pt-1">
          {YEARS.map((year) => (
            <MenuLine key={year}>{year}</MenuLine>
          ))}
          <MenuLine separated>Create a new year</MenuLine>
          </div>
        </div>
      </Popover>
    </>
  )
}
