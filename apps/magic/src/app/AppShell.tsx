// The chrome every screen sits inside. Without it a screen floats on a white page and reads
// as a web page rather than as an application.
//
// THIS IS A WINDOWS DESKTOP APPLICATION THAT ALSO RUNS IN A BROWSER, and it has to look the
// same in both. So the top strip is chrome, not a site header: it does not centre on a
// content width, it does not scroll away, and nothing in it is a link. The rail and the strip
// are fixed furniture and only the middle moves.
//
// ONLY THE TOP STRIP AND THE RAIL ARE FIXED. Everything below them scrolls, including each
// screen's own title row and toolbar — that is v2's behaviour and Aj's ruling. The listing
// reference build does the opposite, pinning its header, and the ruling is v2's.
//
// THE SCROLLING IS THE SCREEN'S, NOT THIS FILE'S. This owned it for one run — the content area
// was `overflow-auto` — and it broke the create screen, which is not a page that scrolls: its
// grid measures the height it is given and pads itself with empty rows to fill it, so an
// unbounded box makes it grow against its own measurement. So this hands each screen a
// BOUNDED box and the screen says whether it scrolls. The listing scrolls whole; the invoice
// fills the height and scrolls its rows.
//
// Nothing here or in a screen compresses its padding on a short window. A layout that quietly
// gets tighter as the window shrinks is one nobody can predict.
//
// THE TOP STRIP IS TopBar.tsx. It is a separate file because the strip is its own subject —
// six menus, the book, the year and three controls — and this file is about the frame those
// sit in: what is fixed, what scrolls, and who owns the scrolling.

import * as React from 'react'

import { Button } from '@busy/ui/Button'
import { Icon, type IconName } from '@busy/ui/Icon'
import { NotBuiltMark } from '@busy/ui/NotBuilt'
import { cn } from '@busy/ui/cn'
import { TopBar } from './TopBar'

/** The modules, in the v2 build's own order and its own words — Sales, Purchase, Party, Items,
 * Payments & Banking, GST, Inventory, Reports, Settings. Taken rather than invented: the first
 * version of this rail had a Dashboard v2 does not have and said "Parties" where v2 says
 * "Party", which is re-deciding something already settled and teaching two vocabularies.
 *
 * Only Sales is built. The rest are here because a rail with one icon is not a rail and the
 * shape of the product is part of what is being shown — and each says it is not built. */
const AREAS: { name: IconName; label: string; built?: boolean }[] = [
  { name: 'invoice', label: 'Sales', built: true },
  { name: 'purchase', label: 'Purchase' },
  { name: 'party', label: 'Party' },
  { name: 'item', label: 'Items' },
  { name: 'rupee', label: 'Payments & Banking' },
  { name: 'report', label: 'GST' },
  { name: 'dashboard', label: 'Inventory' },
  { name: 'report', label: 'Reports' },
  { name: 'help', label: 'Settings' },
]

export type AppShellProps = {
  children: React.ReactNode
  /** Pressing Sales in the rail. It is how you get back to the listing from the create
   * screen, because getting back to a listing is navigation and navigation lives here. */
  onOpenSales?: () => void
}

export function AppShell({ children, onOpenSales }: AppShellProps) {
  const [railOpen, setRailOpen] = React.useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-page text-ink">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Areas of the product"
          className={cn(
            'flex shrink-0 flex-col gap-1 border-r border-stroke bg-surface p-2 transition-all',
            railOpen ? 'w-56' : 'w-14',
          )}
        >
          {/* THE TOGGLE BELONGS TO THE COLUMN IT OPENS. It was the first thing in the top strip,
              which put it in the row above the thing it controls and welded the two into one L
              with no gap at the corner. v2 heads the rail with it. */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="mb-1 self-start"
            aria-label={railOpen ? 'Collapse the menu' : 'Expand the menu'}
            aria-expanded={railOpen}
            onClick={() => setRailOpen((was) => !was)}
          >
            <Icon name="menu" />
          </Button>

          {AREAS.map((area) => (
            <button
              key={area.label}
              type="button"
              aria-current={area.built === true ? 'page' : undefined}
              // A rail that is icons-only still has to say what each icon is, so the label is
              // always in the accessible name whether or not the eye can see it. Every area
              // but Sales is switched off AND says why in the same breath — the rail exists
              // because a product with one area on it is not the product, but a rail of five
              // buttons that lie is worse than no rail.
              aria-label={area.built === true ? area.label : `${area.label} — not built yet`}
              title={area.built === true ? area.label : `${area.label} — not built yet`}
              onClick={area.built === true ? onOpenSales : undefined}
              disabled={area.built !== true}
              className={cn(
                'relative flex h-10 items-center gap-3 rounded-control px-3 text-body',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus',
                'disabled:cursor-not-allowed disabled:opacity-50',
                area.built === true
                  ? 'bg-surface-selected font-label text-ink-accent'
                  : 'text-ink-secondary',
              )}
            >
              <Icon name={area.name} />
              {railOpen ? <span className="truncate">{area.label}</span> : null}
              {/* THE RAIL KEEPS ITS PER-ITEM MARK rather than one line over the whole column.
                  Eight of the nine are unbuilt, but the rail is how somebody learns what the
                  product IS — the shape is the point, and a single "not built yet" across it
                  would read as "this product does not exist".
                  ONLY WHILE IT IS OPEN. Collapsed, the rail is icons alone in fifty-six pixels
                  and the mark lands on top of the glyph — eight rings sitting on eight icons,
                  which is noise rather than a footnote. A mark belongs beside a label, and with
                  no label there is nowhere for it to sit. The tooltip still says it. */}
              {railOpen && area.built !== true ? <NotBuiltMark className="ml-auto" /> : null}
            </button>
          ))}
        </nav>

        {/* NOT a <main>. A document has one main region and it belongs to the SCREEN, not to
            the frame around it — the shell is chrome. It was a <main> here for one run, which
            put two in the document, and `document.querySelector('main')` in an existing
            journey started finding the frame instead of the invoice it was asking about. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>

    </div>
  )
}
