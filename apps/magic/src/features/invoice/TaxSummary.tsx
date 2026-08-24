// The tax summary, grouped by rate. Closed until somebody wants it.
//
// GROUPED BY RATE, NOT BY HSN. One line per rate is what a GSTR-1 summary and every printed
// tax invoice show, and HSN is a per-line fact that is already a grid column. HSN-wise is a
// setting for the people who need it, not the default for everybody.
//
// WHERE IT SITS: to the RIGHT of the charges, with narration full width underneath both. That
// is v2's arrangement and it survives the reading test — the two tables are the same kind of
// thing, read across, and the note is a different kind of thing, read down. Putting the
// summary under narration would have separated the two tables by a paragraph.
//
// IT ADDS THE ALREADY-ROUNDED FIGURES. Working the total out again from the taxable values
// gives a number a rupee or two from the one on the invoice, and two figures disagreeing on
// one screen is what an operator cannot explain to a customer.

import { useMemo, useState } from 'react'

import { Icon } from '@busy/ui/Icon'
import { formatPaise } from '../../lib/money'
import { applySundries } from '../../lib/sundry'
import { placeOfSupply, taxInside, taxSummary, type SummaryLine } from '../../lib/tax'
import { useInvoice } from './store'

function Amount({ paise, strong = false }: { paise: number; strong?: boolean }) {
  return (
    <td className={`px-3 py-1 text-right ${strong ? 'font-strong text-ink' : 'text-ink-secondary'}`}>
      {/* A zero in a tax column is a dash: nothing was charged, and a column of 0.00 reads as
          money that changed hands. */}
      {paise === 0 ? '—' : formatPaise(paise)}
    </td>
  )
}

export function TaxSummary() {
  const rows = useInvoice((state) => state.rows)
  const sundries = useInvoice((state) => state.sundries)
  const settings = useInvoice((state) => state.settings)
  const party = useInvoice((state) => state.party)
  const [open, setOpen] = useState(false)

  const { place, summary } = useMemo(() => {
    const where = placeOfSupply(settings.companyStateCode, party?.gstin ?? '', settings.companyStateCode)
    const filled = rows.filter((row) => row.itemId !== null)
    const goods = {
      subtotalPaise: filled.reduce((running, row) => running + row.amountPaise, 0),
      quantity: filled.reduce((running, row) => running + row.quantity, 0),
    }
    const charged = applySundries(goods, sundries)
    const taxable = filled.map((row) => ({
      amountPaise:
        settings.taxMode === 'itemInclusive' ? row.amountPaise - taxInside(row.amountPaise, row.taxPercent) : row.amountPaise,
      taxPercent: row.taxPercent,
      taxTreatment: row.taxTreatment,
      cessPercent: row.cessPercent,
    }))
    return { place: where, summary: taxSummary(taxable, charged.taxableChargesPaise, where) }
  }, [rows, sundries, settings, party])

  const columns = place === 'intra' ? (['cgstPaise', 'sgstPaise'] as const) : (['igstPaise'] as const)
  const headings = place === 'intra' ? ['CGST', 'SGST'] : ['IGST']
  const anyCess = summary.total.cessPaise > 0

  return (
    <section aria-label="Tax summary" className="min-w-0 basis-2/5 rounded-card border border-stroke bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        className="flex w-full items-center gap-2 rounded-t-card px-3 py-2 text-sm font-strong text-ink-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-stroke-focus"
      >
        <Icon name="chevronDown" className={`size-icon-sm ${open ? 'rotate-180' : ''}`} />
        Tax summary — rate wise
        <span className="ml-auto font-body text-ink-muted">
          {summary.lines.length === 0 ? '' : `${summary.lines.length} ${summary.lines.length === 1 ? 'rate' : 'rates'}`}
        </span>
      </button>

      {open ? (
        <table className="w-full border-t border-stroke text-body">
          <thead>
            <tr className="bg-surface-sunken text-sm font-label text-ink-secondary">
              <th scope="col" className="px-3 py-1 text-left">Tax rate</th>
              <th scope="col" className="px-3 py-1 text-right">Taxable</th>
              {headings.map((heading) => (
                <th key={heading} scope="col" className="px-3 py-1 text-right">{heading}</th>
              ))}
              {anyCess ? <th scope="col" className="px-3 py-1 text-right">Cess</th> : null}
            </tr>
          </thead>
          <tbody>
            {summary.lines.map((line: SummaryLine) => (
              <tr key={line.label} className="border-t border-stroke">
                <td className="px-3 py-1 text-ink">{line.label}</td>
                <Amount paise={line.taxablePaise} />
                {columns.map((column) => (
                  <Amount key={column} paise={line[column]} />
                ))}
                {anyCess ? <Amount paise={line.cessPaise} /> : null}
              </tr>
            ))}
          </tbody>
          {summary.lines.length > 1 ? (
            <tfoot>
              <tr className="border-t border-stroke bg-surface-sunken">
                <td className="px-3 py-1 font-strong text-ink">{summary.total.label}</td>
                <Amount paise={summary.total.taxablePaise} strong />
                {columns.map((column) => (
                  <Amount key={column} paise={summary.total[column]} strong />
                ))}
                {anyCess ? <Amount paise={summary.total.cessPaise} strong /> : null}
              </tr>
            </tfoot>
          ) : null}
        </table>
      ) : null}
    </section>
  )
}
