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

import { TableHeading } from '@busy/ui/TableHeading'
import { formatPaise } from '../../lib/money'
import { placeOfSupply } from '../../lib/tax'
import { invoiceBreakdown } from '../../lib/totals'
import { SundryLine } from './SundryLine'
import { SUNDRY_WIDTHS } from './sundryColumns'
import { useInvoice } from './store'

function HeadCell({ label, width, end = false }: { label: string; width: string; end?: boolean }) {
  return (
    // The same species of heading as the item grid above it — and now literally the same
    // component, which is what makes that true rather than a sentence somebody has to keep
    // honouring. Two tables on one screen that treat their headings differently read as two
    // products, and the way that happened before was three copies of one class run.
    <TableHeading
      as="div"
      sticky={false}
      className={`flex h-full items-center border-r border-stroke px-2 last:border-r-0 ${width} ${
        end ? 'justify-end' : ''
      }`}
    >
      {label}
    </TableHeading>
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
      {/* A TABLE, NOT A GRID, AND THAT IS A CORRECTION RATHER THAN A DOWNGRADE.
          It wore role="grid" with no arrow keys, no cell cursor and no tabindex management —
          which is a control reporting a state it is not in, the one thing this codebase bans
          outright. A screen reader hearing "grid" tells its user to navigate with the arrows,
          and the arrows did nothing here.
          THE FIX IS THE ROLE, NOT THE BEHAVIOUR. The item grid is a spreadsheet: any cell can be
          typed into and the arrows are how you get around it. This is three charges with a
          picker and one figure each, and the generated tax rows underneath cannot be typed into
          at all — Tab already walks exactly what is walkable. Building a second cell cursor for
          it would be a second copy of the item grid's keyboard, on a surface that does not want
          one, which is the duplication this repo is arranged against.
          `rowgroup` on the wrappers because a bare div between a table and its rows breaks the
          ownership chain, and the rows stop being the table's to a screen reader. */}
      <div role="table" aria-label="Bill sundry" className="flex min-h-0 flex-1 flex-col">
        <div role="rowgroup">
        <div role="row" className="flex h-row items-stretch rounded-t-card border-b border-stroke bg-surface-sunken">
          <HeadCell label="Sundry" width={SUNDRY_WIDTHS.name} />
          <HeadCell label="Type" width={SUNDRY_WIDTHS.type} />
          <HeadCell label="@ / ₹" width={SUNDRY_WIDTHS.value} end />
          <HeadCell label="Amount" width={SUNDRY_WIDTHS.amount} end />
        </div>
        </div>

        <div role="rowgroup">
          {sundries.map((row, index) => (
            <SundryLine key={row.id} row={row} index={index} amountPaise={amountOf(row.id)} />
          ))}

          {generated.map((row) => (
            <div
              key={row.id}
              role="row"
              className="flex h-row items-stretch border-b border-stroke bg-surface-sunken last:border-b-0"
            >
              <div role="cell" className={`flex h-full items-center border-r border-stroke px-2 text-body text-ink-secondary ${SUNDRY_WIDTHS.name}`}>
                {row.name}
              </div>
              <div role="cell" className={`flex h-full items-center border-r border-stroke px-2 text-body text-ink-muted ${SUNDRY_WIDTHS.type}`}>
                Tax
              </div>
              <div role="cell" className={`flex h-full items-center justify-end border-r border-stroke px-2 text-body text-ink-muted ${SUNDRY_WIDTHS.value}`}>
                {row.value}%
              </div>
              <div role="cell" className={`flex h-full items-center justify-end px-2 text-body text-ink-secondary ${SUNDRY_WIDTHS.amount}`}>
                {formatPaise(row.amountPaise)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
