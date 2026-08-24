// The strip across the top of the window.
//
// THIS IS A WINDOWS DESKTOP APPLICATION THAT ALSO RUNS IN A BROWSER, and it has to look the
// same in both. So the strip is chrome, not a site header: it does not centre on a content
// width, it does not scroll away, and only one thing in it is a link.
//
// THREE COLUMNS, NOT TWO GROUPS AND A SPACER. The company name is the anchor of the window and
// it sits in the TRUE centre. A single spacer cannot give you that: the middle then lands
// wherever the left group's width leaves it, and the left group changes width the moment
// somebody expands the rail — so the name would slide sideways for a reason that has nothing to
// do with it. The outer two columns are `flex-1 basis-0`, which makes them equal by definition
// whatever is inside them, so the middle is centred on the WINDOW and stays there. `min-w-0` on
// all three, or a long company name pushes the columns out of balance instead of truncating.
//
// NOTHING IN HERE IS A CONTROL THAT LIES. Night mode is not built — the dark palette is step
// five — so its button is switched off and carries the reason. Every menu line behind the
// company and the year needs a backend that is not there, so each one is disabled and says so.
// Favourites and Housekeeping have nothing in them at all, and say that rather than opening
// onto blank space. A live-looking control that does nothing is worse than a disabled one that
// explains itself, because the person who presses it cannot tell whether the product is broken
// or they are.

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { NotBuiltMark } from '@busy/ui/NotBuilt'
import { CompanyMenu } from './CompanyMenu'
import { DensitySwitch } from './DensitySwitch'
import { HelpMenu } from './HelpMenu'
import { NothingHereYet, TopMenu } from './TopMenu'
import { UserMenu } from './UserMenu'
import { YearMenu } from './YearMenu'

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-stroke bg-surface px-3">
      {/* THE RAIL'S TOGGLE IS IN THE RAIL. It sat here, at the very top-left, which put a
          control belonging to the column below inside the row above it — and with no gap at the
          corner the strip and the rail read as one welded L rather than as a bar over a column.
          v2 keeps the toggle at the head of the rail and lets the brand lead the strip. */}
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-1">
        {/* THE REAL MARK, not the word set in the UI typeface. It was BUSY in our own face
            with a blue U — a passable stand-in, and not the logo: the letterforms, the spacing
            and the blue are the brand's and none of them are ours to redraw. It ships with the
            app rather than loading from a network, so the shell reads BUSY whether or not
            anything else is reachable. The dark variant is beside it for step five. */}
        <img src="/busy-logo-light.avif" alt="BUSY" className="mr-2 h-5 w-auto" />

        <span className="mr-2 h-6 w-px shrink-0 bg-stroke" />

        <UserMenu />
        <TopMenu label="Favourites">
          <NothingHereYet what="Marking a screen as a favourite" />
        </TopMenu>
        <TopMenu label="Housekeeping">
          <NothingHereYet what="Housekeeping" />
        </TopMenu>
        <HelpMenu />
      </div>

      {/* The book, and the year it is open in. Two controls rather than one: see CompanyMenu. */}
      <div className="flex min-w-0 items-center gap-2">
        <CompanyMenu />
        <YearMenu />
      </div>

      <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-2">
        {/* A BORDERED CONTROL IN DARK INK, WHICH IS WHAT v2 ACTUALLY DRAWS. I built this as bare
            accent text on the strength of a comment in v2's stylesheet saying POS is "shaped
            like a link" — and never looked at the rendered page, where it wears v2's ordinary
            button: a hairline, a surface fill and the default ink. Reading the comment instead
            of the rendering is the proxy-for-evidence fault this codebase bans, arriving by way
            of a source file rather than a screenshot.
            The outward arrow stays, and stays muted: that is what says this one leaves. */}
        <Button asChild variant="outline" size="sm">
          <a href="/pos" title="Open the POS retail counter — this leaves the invoice screen">
            Open POS counter
            <span aria-hidden="true" className="text-ink-muted">
              ↗
            </span>
          </a>
        </Button>

        <span className="mx-1 h-6 w-px shrink-0 bg-stroke" />

        <DensitySwitch />

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          disabled
          // Disabled controls take no pointer, so the browser never shows their title. The
          // reason is on the element for a screen reader and repeated in the help menu, where
          // somebody who wondered will actually go looking.
          aria-label="Night mode — not built yet. The dark theme is the step after this one."
          title="Night mode — not built yet. The dark theme is the step after this one."
        >
          <Icon name="moon" />
          <NotBuiltMark className="absolute top-0.5 right-0.5" />
        </Button>
      </div>
    </header>
  )
}
