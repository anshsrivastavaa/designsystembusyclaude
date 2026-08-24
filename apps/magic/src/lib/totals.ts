// What the footer says. Pure, so the arithmetic can be tested and mutated without a screen.
//
// Worked out from the whole list every time rather than kept up to date as rows change.
// Adding two thousand integers takes well under a millisecond; the cost at size was never the
// maths, it was re-rendering rows, which is what memoising fixed.
//
// THE ORDER OF THE BREAKDOWN IS NOT TASTE. Sub-total, Bill sundry, Tax, Round off, Grand
// Total. Charges sit ABOVE tax because under GST the taxable value includes packing and
// freight the supplier charges, so freight is taxed at the rate of the goods it carries — a
// column reading sub-total, tax, freight tells the operator freight escaped tax. Round off
// sits after tax because it applies to the final payable, and the tax figures above it are
// what get filed.

import type { InvoiceSettings } from '../data/schema/settings'
import type { SundryRow } from '../data/schema/sundry'
import { sumPaise, type Paise } from './money'
import { roundOffPaise } from './roundOff'
import { applySundries, generateTaxRows } from './sundry'
import { bands, taxInside, type Band, type PlaceOfSupply } from './tax'

export type InvoiceLine = {
  itemId: string | null
  quantity: number
  amountPaise: Paise
  taxPercent: number
}

export type Breakdown = {
  /** Rows that actually carry an item. An empty row waiting to be typed into is not a line. */
  lines: number
  subtotalPaise: Paise
  /** Every ordinary charge. The Bill sundry line. */
  chargesPaise: Paise
  taxPaise: Paise
  /** True when tax is already inside the sub-total. The line then reads "of which tax", never
   * "Tax" — a figure labelled "of which" cannot be added to the one above it, and a reader
   * who misses the word "Incl." and adds them is the failure this guards against. */
  taxIsInside: boolean
  roundOffPaise: Paise
  grandTotalPaise: Paise
  /** One per rate used, ascending. The collapsed strip says how many there are; the tax
   * summary lists them. */
  bands: Band[]
  /** The rows bill-wise mode generated, already costed. Empty in both item-level modes. */
  sundryRows: SundryRow[]
}

export type BreakdownInput = {
  rows: readonly InvoiceLine[]
  sundries: readonly SundryRow[]
  settings: InvoiceSettings
  place: PlaceOfSupply
}

export function invoiceBreakdown({ rows, sundries, settings, place }: BreakdownInput): Breakdown {
  const raw = rows.filter((row) => row.itemId !== null)

  // ROUND EACH LINE, THEN ADD. Off by default, and when it is on the totals use the values the
  // COLUMN is showing — they are never worked out again from the unrounded ones. That is the
  // whole point of the setting: a company that rounds its lines wants the invoice to add up to
  // what its own column says, down to the paise, because that is what the customer checks.
  // Recomputing from the unrounded numbers would put the total a rupee or two away from the
  // column above it, which is the disagreement nobody can explain at a counter.
  const filled = settings.roundEachLine
    ? raw.map((row) => ({ ...row, amountPaise: Math.round(row.amountPaise / 100) * 100 }))
    : raw

  const goods = {
    subtotalPaise: sumPaise(filled.map((row) => row.amountPaise)),
    quantity: filled.reduce((running, row) => running + row.quantity, 0),
  }

  const charged = applySundries(goods, sundries)

  // In inclusive mode the amounts already hold their tax, so the taxable value has to be
  // taken back out of them before any band is worked out.
  const taxable = filled.map((row) => ({
    amountPaise: settings.taxMode === 'itemInclusive' ? row.amountPaise - taxInside(row.amountPaise, row.taxPercent) : row.amountPaise,
    taxPercent: row.taxPercent,
  }))

  // The charge is quoted INCLUSIVE in item-inclusive mode, the same as the lines beside it.
  const taxBands = bands(taxable, charged.taxableChargesPaise, settings.taxMode === 'itemInclusive')

  // Bill-wise puts tax in the sundry list as its own rows — one per component per band, made
  // here rather than typed by anybody. The item-level modes put tax on the lines. Whichever it
  // is, it is worked out once and read from one place.
  const generated = settings.taxMode === 'billWise' ? generateTaxRows(taxBands, place) : []
  const taxPaise =
    settings.taxMode === 'billWise'
      ? sumPaise(generated.map((row) => row.amountPaise))
      : sumPaise(taxBands.map((band) => band.taxPaise))
  const taxIsInside = settings.taxMode === 'itemInclusive'

  const beforeRounding = goods.subtotalPaise + charged.chargesPaise + (taxIsInside ? 0 : taxPaise)
  const rounding = settings.roundOff.on ? roundOffPaise(beforeRounding, settings.roundOff) : 0

  return {
    lines: filled.length,
    subtotalPaise: goods.subtotalPaise,
    chargesPaise: charged.chargesPaise,
    taxPaise,
    taxIsInside,
    roundOffPaise: rounding,
    grandTotalPaise: beforeRounding + rounding,
    bands: taxBands,
    sundryRows: [...charged.rows, ...generated],
  }
}
