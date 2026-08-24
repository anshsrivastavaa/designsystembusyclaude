// The breakdown. It reads the invoice and says nothing the invoice does not already know.
//
// THE ORDER IS RULED AND IT IS NOT TASTE: Sub-total, Bill sundry, Tax, Round off, Grand
// Total. Why is in lib/totals.ts, beside the arithmetic that depends on it.
//
// "Sub-total" is the first line AND the card's heading — there is no word "Breakdown" on the
// screen. It takes the heading row's height, which lines the label up with the column above.
//
// THE GRAND TOTAL IS A READ-OUT AND MAY NEVER BECOME A FIELD. Not an input, not
// contentEditable, not "just for adjustments". Round off is how the payable is adjusted, and
// a typed-over total is a total that disagrees with the lines that make it.

import { useMemo, useState } from 'react'

import { Checkbox } from '@busy/ui/Checkbox'
import { Icon } from '@busy/ui/Icon'
import { formatPaise } from '../../lib/money'
import { invoiceBreakdown } from '../../lib/totals'
import { placeOfSupply } from '../../lib/tax'
import { useInvoice } from './store'

function Line({ label, value, muted = false }: { label: React.ReactNode; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-8 ${muted ? 'text-ink-secondary' : 'text-ink'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export function Breakdown() {
  const rows = useInvoice((state) => state.rows)
  const sundries = useInvoice((state) => state.sundries)
  const settings = useInvoice((state) => state.settings)
  const party = useInvoice((state) => state.party)
  const setRoundOff = useInvoice((state) => state.setRoundOff)
  const roundOffOn = useInvoice((state) => state.roundOffOn)
  // Open. It used to fold itself on a short screen, to hand rows back to the item grid — and
  // with one scrolling column there is nothing to hand back and nothing to compete for. The
  // fold stays as a control the user works; it is no longer a response to the window.
  const [open, setOpen] = useState(true)

  const breakdown = useMemo(() => {
    // A party with no GSTIN and no address is a walk-in at the counter, and a walk-in is
    // local. Falling through to "inter-state" would charge IGST on every cash sale.
    const place = placeOfSupply(settings.companyStateCode, party?.gstin ?? '', settings.companyStateCode)
    return invoiceBreakdown({ rows, sundries, settings: { ...settings, roundOff: { ...settings.roundOff, on: roundOffOn } }, place })
  }, [rows, sundries, settings, party, roundOffOn])

  const taxLabel = breakdown.taxIsInside ? 'of which tax' : 'Tax'
  const rates = breakdown.bands.length

  return (
    <section
      aria-label="Invoice breakdown"
      className="w-80 shrink-0 rounded-card border border-stroke bg-surface px-6 py-4 text-body"
    >
      <div className="flex items-baseline justify-between gap-8">
        <span className="text-ink">Sub-total</span>
        <span className="flex items-baseline gap-3">
          <span className="text-ink">{formatPaise(breakdown.subtotalPaise)}</span>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Hide the breakdown' : 'Show the breakdown'}
            onClick={() => setOpen((was) => !was)}
            className="rounded-control px-1 text-ink-muted hover:text-ink focus-ring"
          >
            {/* A drawn icon, not a typed character. ⌃ and ⌄ are a font's opinion: they sit
                off the baseline, change size between faces, and are absent from some. */}
            <Icon name="chevronDown" className={`size-icon-sm ${open ? 'rotate-180' : ''}`} />
          </button>
        </span>
      </div>

      {open ? (
        <div className="mt-2 space-y-2">
          <Line label="Bill sundry" value={formatPaise(breakdown.chargesPaise)} muted />
          <Line label={taxLabel} value={formatPaise(breakdown.taxPaise)} muted />

          {/* Round off is ONE thing: the line and its switch together, sitting where the order
              puts it. A control that changes the total may not sit below the total. The step
              and the method are the company's settings and are shown, not offered. */}
          <div className="flex items-baseline justify-between gap-8 text-ink-secondary">
            <span className="flex items-center gap-2">
              <Checkbox
                checked={roundOffOn}
                onChange={(event) => setRoundOff(event.target.checked)}
                aria-label="Round off this invoice"
              />
              <span>Round off</span>
              <span className="text-ink-muted">· {settings.roundOff.method}</span>
            </span>
            <span>{formatPaise(breakdown.roundOffPaise)}</span>
          </div>
        </div>
      ) : (
        // Closed, the strip is a FIXED set of three: sub-total above, one combined tax figure,
        // and how many rates are behind it. v2 showed however many values the invoice happened
        // to have and grew a sideways scrollbar the moment a second rate appeared.
        <div className="mt-2">
          <Line
            label={
              <span>
                {taxLabel}
                {rates > 1 ? <span className="text-ink-muted"> · {rates} rates</span> : null}
              </span>
            }
            value={formatPaise(breakdown.taxPaise)}
            muted
          />
        </div>
      )}

      <div className="mt-3 flex items-baseline justify-between gap-8 border-t border-stroke pt-3">
        <span className="font-label text-ink">Grand Total</span>
        {/* The rupee symbol appears here and nowhere else on the invoice. One symbol is what
            makes this figure read as the answer rather than as another number in a column. */}
        <span className="text-lg font-total text-ink">₹{formatPaise(breakdown.grandTotalPaise)}</span>
      </div>
    </section>
  )
}
