// Create Invoice. All four regions are here: the party header, the item grid, the footer —
// bill sundry and the breakdown — and save.
//
// What is NOT here yet, so the next session does not have to find out by reading: narration,
// the tax summary, the three tax modes on screen, per-line rounding, and the profit strip.
// The arithmetic behind the tax modes is built and tested in lib/; the modes are not drawn.

import { useEffect, useRef, useState } from 'react'

import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import type { InvoiceSettings } from '../../data/schema/settings'
import { useInvoice } from './store'
import { ItemGrid } from './ItemGrid'
import { InvoiceHeader } from './InvoiceHeader'
import type { VoucherType } from './voucherTypes'
import { PartyHeader } from './PartyHeader'
import { Breakdown } from './Breakdown'
import { Narration } from './Narration'
import { ItemStrip } from './ItemStrip'
import { actionFor } from '../../lib/shortcuts'
import { nextSection, sectionOf } from './nextSection'
import { SelectedRows } from './SelectedRows'
import { SundryGrid } from './SundryGrid'
import { TransportDrawer } from './TransportDrawer'
import { TaxSummary } from './TaxSummary'
import { SaveInvoice } from './SaveInvoice'
import { useKeyboardStaysInside } from './focusHome'

/** How many rows to open with. `?rows=2000` opens a saved invoice of that size, cold. */
function requestedRows(): number | null {
  const asked = new URLSearchParams(window.location.search).get('rows')
  if (asked === null) return null
  const count = Number.parseInt(asked, 10)
  return Number.isFinite(count) && count > 0 ? count : null
}

export function CreateInvoice({
  settings,
  onOpenSettings,
  onBack,
}: {
  settings?: InvoiceSettings
  onOpenSettings?: () => void
  /** Where the back control goes. The shell decides, because only the shell knows what is
   * behind this screen. */
  onBack?: () => void
}) {
  const load = useInvoice((state) => state.load)
  const reset = useInvoice((state) => state.reset)
  const loadSettings = useInvoice((state) => state.loadSettings)
  const invoice = useRef<HTMLElement>(null)
  useKeyboardStaysInside(invoice)
  const [, setLoading] = useState(requestedRows() !== null)
  const [refused, setRefused] = useState<string | null>(null)
  const [favourite, setFavourite] = useState(false)
  // WHAT THIS DOCUMENT IS, and it lives beside the favourite because it is the same kind of
  // fact: something about the whole voucher rather than about a line on it.
  const [voucherType, setVoucherType] = useState<VoucherType>('Invoice')
  const [transport, setTransport] = useState(false)
  // Save's own doing, handed up so F2's last jump can run it. A ref rather than state: nothing
  // renders differently because of it, and it is read from an event listener that outlives a
  // render.
  const saveNow = useRef<(() => void) | null>(null)

  // How this company bills. It arrives one of two ways and both come in through the same door:
  // from the adapter when the screen opens, and from the settings drawer whenever somebody
  // moves a switch — the SHELL hands that in as a prop rather than reaching into this feature's
  // store, because the shell reaching into a feature's internals is how a shared store starts.
  useEffect(() => {
    if (settings !== undefined) {
      loadSettings(settings)
      return
    }
    void data.invoiceSettings().then((answer) => {
      if (!isRefusal(answer)) loadSettings(answer)
    })
  }, [loadSettings, settings])

  // A NEW INVOICE STARTS EMPTY. The store outlives the screen, so without this the second
  // invoice of the day opened holding the first one — party, lines, charges and all — and the
  // only thing that ever cleared it was `?rows=N` on the address, which nobody types.
  useEffect(() => {
    if (requestedRows() === null) reset()
  }, [reset])

  useEffect(() => {
    const count = requestedRows()
    if (count === null) return
    void data.getInvoice(String(count)).then((answer) => {
      setLoading(false)
      if (isRefusal(answer)) {
        setRefused(answer.message)
        return
      }
      load(answer.rows, answer.paidPaise)
    })
  }, [load])

  // F2 WALKS THE INVOICE: party → items → charges → save, and the last press SAVES rather than
  // landing on the button. That condition is what keeps the F2 badge on Save honest.
  //
  // IT LISTENS ON THE WHOLE SCREEN, in the capture phase, because F2 has to mean the same thing
  // wherever the keyboard is — including inside the item grid, which binds F2 for its own
  // purposes, and including on a control that is not in any section at all.
  //
  // NOT INSIDE A DRAWER. A drawer is a job you are in the middle of, and F2 creates the record
  // there — that binding is untouched, and this steps aside for it rather than fighting it.
  useEffect(() => {
    const jump = (event: KeyboardEvent) => {
      // Which key this is comes from the one table, like every other shortcut on the product.
      if (actionFor(event, 'global') !== 'next-section') return
      const active = document.activeElement
      if (active?.closest('[role="dialog"]') != null) return
      event.preventDefault()
      event.stopPropagation()

      const here = sectionOf(active)
      // Not in any section — the header, the top bar, nowhere. The invoice starts at the party,
      // so that is where "done with this" means to go.
      const going = here === null ? 'party' : nextSection(here)
      if (here === 'save' || going === 'save') {
        saveNow.current?.()
        return
      }
      // THE GRID IS ASKED THROUGH THE STORE, NOT THE DOM. A cell is a div until the cursor is
      // on it, so there is nothing to focus until the cursor has moved — placing the cursor is
      // what makes the field exist, and the cell then takes the keyboard itself.
      if (going === 'items') {
        useInvoice.getState().moveTo({ row: 0, column: 'item' })
        return
      }
      const landing = document.querySelector<HTMLElement>(
        going === 'party' ? '[aria-label="Party"] input' : '[aria-label="Bill sundry"] input',
      )
      landing?.focus()
    }
    document.addEventListener('keydown', jump, true)
    return () => document.removeEventListener('keydown', jump, true)
  }, [])

  return (
    // ONE SCROLLING COLUMN, AND THE ACTION BAR IS THE ONLY PINNED THING ON IT. The header, the
    // party row, the grid and the footer travel together; the bar stays, because an action you
    // have to scroll to find is an action people stop using.
    // A PAGE INSET, BECAUSE SIXTEEN PIXELS IS A SEAM RATHER THAN A MARGIN. The white plane ran
    // hard against the rail's border — rail right edge 56, plane left edge 56 — so the header
    // read as attached to the chrome rather than as the page the chrome is holding.
    //
    // THE NUMBER IS v2's PAGE INSET, AND IT IS NOT v2's RAIL GAP, BECAUSE v2 HAS NO RAIL HERE.
    // Measured at 1470: v2's create screen carries a top menu and no side rail at all, and its
    // content sits 28 from the window's left edge. So there was no gap to copy, and 28 is the
    // only number v2 actually offers for "how far the page stands off the edge of everything".
    // Written down because "take v2's number" was the instruction and v2 turned out not to have
    // one — the next person should not go looking for it again.
    //
    // BOTH SIDES. On the left alone the plane would be a banner with a gap down one edge; it
    // already ran to the window's right edge, so insetting one side and not the other reads as
    // a mistake rather than as a margin.
    <main ref={invoice} className="mx-7 flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-page text-ink">
      {/* ONE WHITE PLANE, running down from the top bar and carrying both the title row and the
          party row. That is what makes the chrome read as one object instead of three stacked
          strips — v2's arrangement, and the thing Aj has asked for three times. */}
      <div className="shrink-0 rounded-b-card bg-surface px-4 pt-2 pb-3">
        <InvoiceHeader
          type={voucherType}
          onSwitch={setVoucherType}
          favourite={favourite}
          onFavourite={() => setFavourite((was) => !was)}
          onBack={onBack ?? (() => undefined)}
          onSettings={onOpenSettings ?? (() => undefined)}
        />
        <PartyHeader onOpenTransport={() => setTransport(true)} onOpenSettings={onOpenSettings ?? (() => undefined)} />
      </div>

      {/* BOTTOM CLEARANCE EQUAL TO THE ACTION BAR. The bar is sticky INSIDE this scroller, so
          it floats over whatever the content ends with — and today the Grand Total clears it
          only because of where the cards happen to end. One more line in the breakdown, and an
          advance settled or a split payment are both coming, and the total goes under the bar.
          A journey asserts the last line is not covered, because this shape comes back every
          time anything is pinned. */}
      <div className="flex flex-col gap-3 px-4 pt-3 pb-16">

      {/* The grid is as tall as its rows. Nothing competes for height any more, so it has no
          minimum, no maximum and no scroller of its own. */}
      <div>
        {refused ? (
          <div
            role="alert"
            className="flex h-full items-center justify-center rounded-card border border-stroke bg-surface px-6 text-center"
          >
            <p className="max-w-md text-body text-ink">{refused}</p>
          </div>
        ) : (
          <ItemGrid />
        )}
      </div>

      {/* The footer. Bill sundry and narration take the left, the breakdown card the right. */}
      {/* No fixed height. The footer is as tall as its tallest side, so folding the breakdown
          on a short screen actually hands the rows back to the grid — a fold that changes
          nothing above it is a control reporting a state it is not in. */}
      {/* items-START, not stretch. Stretched, the two columns each grew to match the taller
          one — so the charges card carried a large empty area under its last row whenever the
          breakdown beside it was longer. A column is as tall as what is in it. */}
      <SelectedRows />

      <ItemStrip />

      {/* v2's arrangement: the charges and the tax summary side by side, narration full width
          under both. The two tables are the same kind of thing and are read ACROSS; the note is
          a different kind of thing and is read DOWN. Putting the summary under narration would
          separate the two tables by a paragraph. */}
      <footer className="flex shrink-0 items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <SundryGrid />
            <TaxSummary />
          </div>
          <Narration />
        </div>
        <Breakdown />
      </footer>
      </div>

      <TransportDrawer open={transport} onClose={() => setTransport(false)} />

      <div className="sticky bottom-0 z-20 mt-auto shrink-0 bg-surface-page px-4 pb-3">
        <SaveInvoice onReady={(run) => { saveNow.current = run }} />
      </div>
    </main>
  )
}
