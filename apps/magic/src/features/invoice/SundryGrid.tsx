// Bill sundry: the charges that apply to the whole invoice rather than to one line.
//
// TWO BLANK ROWS ON A FRESH INVOICE, ONE TRAILING BLANK AFTER THAT. The item grid's rule.
// A row you can type into has to be there before you want it; a second empty one below it is
// a hole in the list.
//
// The generated tax rows sit below the charges and cannot be typed into. In bill-wise mode the
// invoice makes one per tax component per rate band — six rows for three rates sold locally —
// and their values are arithmetic. A field that lets you type over arithmetic is a field that
// lets you file a wrong return.

import { useMemo } from 'react'

import { formatPaise } from '../../lib/money'
import { placeOfSupply } from '../../lib/tax'
import { invoiceBreakdown } from '../../lib/totals'
import { SundryLine } from './SundryLine'
import { SUNDRY_WIDTHS } from './sundryColumns'
import { useInvoice } from './store'

function HeadCell({ label, width, end = false }: { label: string; width: string; end?: boolean }) {
  return (
    <div
      role="columnheader"
      // The same species of heading as the item grid above it. Two tables on one screen that
      // treat their headings differently read as two products.
      className={`flex h-full items-center border-r border-stroke px-2 text-caps font-strong uppercase tracking-wide text-ink-muted last:border-r-0 ${width} ${
        end ? 'justify-end' : ''
      }`}
    >
      {label}
    </div>
  )
}

export function SundryGrid() {
  const rows = useInvoice((state) => state.rows)
  const sundries = useInvoice((state) => state.sundries)
  const settings = useInvoice((state) => state.settings)
  const party = useInvoice((state) => state.party)

  const breakdown = useMemo(() => {
    const place = placeOfSupply(settings.companyStateCode, party?.gstin ?? '', settings.companyStateCode)
    return invoiceBreakdown({ rows, sundries, settings, place })
  }, [rows, sundries, settings, party])

  const amountOf = (id: string) => breakdown.sundryRows.find((row) => row.id === id)?.amountPaise ?? 0
  const generated = breakdown.sundryRows.filter((row) => row.taxComponent !== null)

  return (
    <section
      aria-label="Bill sundry"
      // NO HEIGHT AND NO SCROLLER. It had max-h-56 and an overflow-auto inside it, on a screen
      // ruled to be one scrolling column — so a sixth charge went into a little box of its own
      // while the page it sits on scrolls perfectly well. The footer is as tall as its tallest
      // side, and this is one of the two sides.
      // THE WIDER SHARE — v2 gives the charges 1.6 against the tax summary's 1. Written as
      // three fifths against two, because an arbitrary flex value is a number in a class name
      // and this codebase keeps its numbers in the token package.
      className="flex min-w-0 basis-3/5 flex-col rounded-card border border-stroke bg-surface"
    >
      <div role="grid" aria-label="Bill sundry" className="flex min-h-0 flex-1 flex-col">
        <div role="row" className="flex h-row items-stretch rounded-t-card border-b border-stroke bg-surface-sunken">
          <HeadCell label="Sundry" width={SUNDRY_WIDTHS.name} />
          <HeadCell label="Type" width={SUNDRY_WIDTHS.type} />
          <HeadCell label="@ / ₹" width={SUNDRY_WIDTHS.value} end />
          <HeadCell label="Amount" width={SUNDRY_WIDTHS.amount} end />
        </div>

        <div>
          {sundries.map((row, index) => (
            <SundryLine key={row.id} row={row} index={index} amountPaise={amountOf(row.id)} />
          ))}

          {generated.map((row) => (
            <div
              key={row.id}
              role="row"
              className="flex h-row items-stretch border-b border-stroke bg-surface-sunken last:border-b-0"
            >
              <div role="gridcell" className={`flex h-full items-center border-r border-stroke px-2 text-body text-ink-secondary ${SUNDRY_WIDTHS.name}`}>
                {row.name}
              </div>
              <div role="gridcell" className={`flex h-full items-center border-r border-stroke px-2 text-body text-ink-muted ${SUNDRY_WIDTHS.type}`}>
                Tax
              </div>
              <div role="gridcell" className={`flex h-full items-center justify-end border-r border-stroke px-2 text-body text-ink-muted ${SUNDRY_WIDTHS.value}`}>
                {row.value}%
              </div>
              <div role="gridcell" className={`flex h-full items-center justify-end px-2 text-body text-ink-secondary ${SUNDRY_WIDTHS.amount}`}>
                {formatPaise(row.amountPaise)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
