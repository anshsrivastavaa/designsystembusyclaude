// Where tax lands. Two questions, and neither is a setting anybody gets to answer by hand.
//
// WHICH TAX. CGST plus SGST for a sale inside the state, IGST for one that crosses a border.
// Decided by place of supply: the ship-to GSTIN if there is one, otherwise the party's, first
// two digits against the company's own state. Address only when there is no GSTIN at all.
//
// HOW MUCH, PER BAND. An invoice carrying goods at 5%, 12% and 18% has three taxable values,
// not one, and a charge like freight belongs to all three — it carried all of it. So a
// taxable charge is SPREAD across the lines in proportion to what they came to, before any
// tax is worked out, and each share is taxed at the rate of the goods it travelled with.

import { sumPaise, type Paise } from './money'

export type TaxableLine = {
  amountPaise: Paise
  taxPercent: number
  /** Four different ways a line can carry no tax, and a return has to tell them apart.
   * Absent means ordinary taxable goods. */
  taxTreatment?: 'taxable' | 'nil' | 'exempt' | 'zeroRated'
  /** Compensation cess, on top of GST, on a handful of goods. */
  cessPercent?: number
}

export type PlaceOfSupply = 'intra' | 'inter'

/** Two digits of a GSTIN are the state. A party with no GSTIN at all is unregistered, and
 * then the address decides — which the caller supplies, because this file does not know what
 * an address looks like. */
export function placeOfSupply(companyStateCode: string, gstin: string, addressStateCode: string): PlaceOfSupply {
  // TRIMMED ONCE, AND USED TRIMMED. It was trimmed for the emptiness test and then sliced from
  // the untrimmed string, so a GSTIN with a leading space — which is what a paste from a
  // spreadsheet gives you — had its first two characters read as " 2" and matched no state.
  // The invoice then charged IGST on a local sale, which is the wrong tax to the wrong
  // government, and nothing on the screen would have looked odd.
  const theirs = gstin.trim()
  const where = theirs === '' ? addressStateCode.trim() : theirs.slice(0, 2)
  return where === companyStateCode ? 'intra' : 'inter'
}

/** Splits an amount across the lines in proportion to what each line came to, adding up to
 * exactly the amount given — no paise created and none lost.
 *
 * The remainders go to the largest lines first. Handing every leftover paise to the last row
 * was tried and rejected: it makes the smallest line on the invoice carry the whole rounding
 * error, which is where somebody eventually notices it. */
export function spread(lines: readonly TaxableLine[], amountPaise: Paise): Paise[] {
  const total = sumPaise(lines.map((line) => line.amountPaise))
  if (total === 0 || amountPaise === 0) return lines.map(() => 0)

  const exact = lines.map((line) => (line.amountPaise * amountPaise) / total)
  const shares = exact.map((share) => Math.floor(share))
  let left = amountPaise - shares.reduce((running, share) => running + share, 0)

  const order = exact
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((one, two) => two.remainder - one.remainder)

  for (const { index } of order) {
    if (left === 0) break
    const step = left > 0 ? 1 : -1
    shares[index] = shares[index]! + step
    left -= step
  }
  return shares
}

export type Band = {
  /** The rate the goods on this band carry. */
  percent: number
  /** What is taxed at it: the lines, plus their share of the taxable charges. */
  taxablePaise: Paise
  taxPaise: Paise
}

/** One band per rate actually used on the invoice, in ascending rate order. A rate nobody
 * sold at does not appear — including 0%, which appears only when something really is
 * nil-rated, and then it appears with its taxable value and no tax. */
export function bands(lines: readonly TaxableLine[], taxableChargesPaise: Paise = 0): Band[] {
  const shares = spread(lines, taxableChargesPaise)
  const byRate = new Map<number, Paise>()

  lines.forEach((line, index) => {
    const taxable = line.amountPaise + shares[index]!
    byRate.set(line.taxPercent, (byRate.get(line.taxPercent) ?? 0) + taxable)
  })

  return [...byRate.entries()]
    .sort((one, two) => one[0] - two[0])
    .map(([percent, taxablePaise]) => ({
      percent,
      taxablePaise,
      taxPaise: Math.round((taxablePaise * percent) / 100),
    }))
}

/** The tax already inside a price, when prices include tax. 118.00 at 18% holds 18.00 of tax,
 * not 21.24 — the rate applies to the value before tax, and the price is after it. */
export function taxInside(amountPaise: Paise, taxPercent: number): Paise {
  return amountPaise - Math.round((amountPaise * 100) / (100 + taxPercent))
}

/** A line of the tax summary. One per rate for ordinary goods, and one for each of the three
 * ways a line can carry no tax. */
export type SummaryLine = {
  /** "18%", or "Nil-rated" — what the operator reads in the first column. */
  label: string
  taxablePaise: Paise
  cgstPaise: Paise
  sgstPaise: Paise
  igstPaise: Paise
  cessPaise: Paise
}

const NOT_TAXED: Record<string, string> = {
  nil: 'Nil-rated',
  exempt: 'Exempt',
  zeroRated: 'Zero-rated',
}

/**
 * The tax summary, grouped by rate, with the three untaxed treatments on their own lines.
 *
 * IT ADDS THE ALREADY-ROUNDED FIGURES AND NEVER RE-TAXES THE INVOICE TOTAL. Working the total
 * out again from the sum of the taxable values gives a number a rupee or two away from the one
 * on the invoice, and then two figures on one screen disagree — which is the thing an operator
 * cannot explain to a customer standing in front of them.
 */
export function taxSummary(
  lines: readonly TaxableLine[],
  taxableChargesPaise: Paise,
  place: PlaceOfSupply,
): { lines: SummaryLine[]; total: SummaryLine } {
  const ordinary = lines.filter((line) => (line.taxTreatment ?? 'taxable') === 'taxable')
  const shares = spread(lines, taxableChargesPaise)

  const rated = bands(ordinary, sumPaise(lines.map((line, at) => ((line.taxTreatment ?? 'taxable') === 'taxable' ? shares[at]! : 0))))

  const cessOf = (percent: number) =>
    sumPaise(
      ordinary
        .filter((line) => line.taxPercent === percent)
        .map((line) => Math.round((line.amountPaise * (line.cessPercent ?? 0)) / 100)),
    )

  const made: SummaryLine[] = rated.map((band) => ({
    label: `${band.percent}%`,
    taxablePaise: band.taxablePaise,
    // Inside the state the rate splits in half between two components; across a border IGST
    // carries the whole of it. Halving the TAX rather than the rate keeps the two halves
    // adding to exactly the band's tax, which halving the rate twice does not.
    cgstPaise: place === 'intra' ? Math.round(band.taxPaise / 2) : 0,
    sgstPaise: place === 'intra' ? band.taxPaise - Math.round(band.taxPaise / 2) : 0,
    igstPaise: place === 'inter' ? band.taxPaise : 0,
    cessPaise: cessOf(band.percent),
  }))

  for (const [treatment, label] of Object.entries(NOT_TAXED)) {
    const under = lines.filter((line) => line.taxTreatment === treatment)
    if (under.length === 0) continue
    made.push({
      label,
      taxablePaise: sumPaise(under.map((line) => line.amountPaise)),
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      cessPaise: 0,
    })
  }

  const add = (pick: (line: SummaryLine) => Paise) => sumPaise(made.map(pick))
  return {
    lines: made,
    total: {
      label: 'Total',
      taxablePaise: add((line) => line.taxablePaise),
      cgstPaise: add((line) => line.cgstPaise),
      sgstPaise: add((line) => line.sgstPaise),
      igstPaise: add((line) => line.igstPaise),
      cessPaise: add((line) => line.cessPaise),
    },
  }
}
