// The sample invoices a listing screen reads.
//
// AWKWARD CASES ON PURPOSE. This mock is the specification the backend team will read, so it
// carries the invoices that break screens rather than the ones that decorate them: a party
// with no GSTIN, nothing paid, part paid, cancelled, months overdue, and one of eighteen
// hundred rows. A mock made only of happy invoices is a screen that has never been tested.

import type { Invoice } from '../schema/invoice'
import { invoiceOf, invoiceWorth } from './lines'
import { parties } from './parties'

const TODAY = '2026-08-20'

/** THE ONE SHAPE AN INVOICE NUMBER HAS. It had two: `nextInvoiceNumber` offered `68/2026-27`
 * while this file and `saveInvoice` both wrote `INV/2026/0068`, so the number a person watched
 * in the header changed shape the moment they saved it. `N/YYYY-YY` is v2's and it is the one
 * that survives — the mock's own comment beside `nextInvoiceNumber` already said so. */
export function invoiceNumberFor(index: number): string {
  return `${index}/2026-27`
}

/** What an invoice is seeded from. It says what the invoice is WORTH; what it comes to is read
 * off its rows afterwards, never written here. */
type Seed = Partial<Pick<Invoice, 'cancelledAt' | 'eInvoiceStatus' | 'eWayBillStatus' | 'rows'>> & {
  date: string
  dueDate: string
  /** Roughly what it is worth. The standard six-line body is scaled to it. Omitted when `rows`
   * is given outright. */
  worthPaise?: number
  /** How much of it has been paid, as a share of the total. A SHARE RATHER THAN AN AMOUNT,
   * because the total is now derived: a settled invoice has to stay settled to the paisa
   * whatever its lines come to, and a figure typed beside it could not promise that. */
  paidShare?: number
}

function of(index: number, partyIndex: number, seed: Seed): Invoice {
  const party = parties[partyIndex]!
  const rows = seed.rows ?? (seed.worthPaise === undefined ? invoiceOf(6).rows : invoiceWorth(seed.worthPaise).rows)
  // THE HEADER IS READ OFF THE ROWS, ALL THREE FIGURES. It used to spread the two summed ones
  // and then spread the overrides on top, and the overrides always carried a hand-set
  // `totalPaise` — so every seeded invoice reported a total that had nothing to do with its
  // own lines, and sixty-six of the sixty-seven reported the SAME taxable value against
  // Invoice Amounts from 450 to 42,450.
  const header = headerFor(rows)
  return {
    id: `invoice-${index}`,
    number: invoiceNumberFor(index),
    partyId: party.id,
    partyName: party.name,
    cancelledAt: seed.cancelledAt ?? null,
    // Most invoices need neither, and that is an answer rather than a gap: the e-invoice
    // threshold and the distance an e-way bill covers leave the ordinary counter sale out of
    // both. The ones that do need them say so, below.
    eInvoiceStatus: seed.eInvoiceStatus ?? 'notRequired',
    eWayBillStatus: seed.eWayBillStatus ?? 'notRequired',
    date: seed.date,
    dueDate: seed.dueDate,
    ...header,
    paidPaise: Math.round(header.totalPaise * (seed.paidShare ?? 0)),
    rows,
  }
}

/** What the rows come to before tax, the tax on them, and what the invoice is therefore worth.
 *
 * The listing used to reduce over `rows` for the first two, while the schema says a listing
 * reads the header and never opens the rows. That is one figure worked out in two places, which
 * is one figure with two answers the day either side changes. It is worked out here instead —
 * where the invoice is built — and every screen reads the field.
 *
 * THE TOTAL IS HERE TOO NOW, for the same reason and one more: `saveInvoice` was working it out
 * separately as the sum of the line amounts, which is the TAXABLE value. It handed back an
 * invoice whose total was its own sub-total, tax and all missing. */
export function headerFor(rows: Invoice['rows']): { taxablePaise: number; taxPaise: number; totalPaise: number } {
  const taxablePaise = rows.reduce((sum, row) => sum + row.amountPaise, 0)
  const taxPaise = rows.reduce((sum, row) => sum + Math.round((row.amountPaise * row.taxPercent) / 100), 0)
  return { taxablePaise, taxPaise, totalPaise: taxablePaise + taxPaise }
}

/** The financial year this mock lives in: 1 April 2026 to 31 March 2027. Indian financial
 * years run April to March, so a listing defaulting to "this year" in August is showing five
 * months of trading, not eight. */
const YEAR_OPENS = '2026-04-01'

const DAY = 24 * 60 * 60 * 1000

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY).toISOString().slice(0, 10)
}

/**
 * The ordinary trading behind the awkward seven.
 *
 * WHY THESE EXIST. A listing seeded with seven invoices opens with seven rows, and a screen
 * with seven rows cannot show what it does with two hundred — no pager, no scrolling, no
 * sense of density, and every judgement about it made against a page that will never occur.
 *
 * They are deliberately ORDINARY. The seven above are the cases that break screens and they
 * stay exactly as they are; these are the invoices those seven have to be found among.
 * Deterministic, so two runs and two machines see the same listing and a screenshot means
 * something.
 */
function theRestOfTheYear(): Invoice[] {
  return Array.from({ length: 60 }, (_, at) => {
    const index = at + 8
    // Spread across the year, roughly every fourth day, with the gaps a real ledger has.
    const raised = addDays(YEAR_OPENS, at * 4 + (at % 3))
    // WHAT IT IS AIMED AT, not what it comes to. The rows are scaled to this and the header is
    // read off the rows, so the compliance thresholds below are judged on the target — which is
    // a seeding decision about which invoices should demonstrate the portal states, not a claim
    // about any invoice.
    const total = 45_000 + ((at * 337_117) % 4_200_000)
    const party = (at * 5 + 1) % parties.length

    // Four in five are settled, which is what a year of trading looks like from August: the
    // recent ones are still out, the old ones came in.
    const settled = at % 5 !== 0
    const partly = !settled && at % 3 === 0

    // Compliance follows the money, the way the rules do. Above the threshold the portal is
    // involved; below it neither applies. A few are still waiting, which is the whole point of
    // the compliance filters having something to find.
    const large = total > 2_000_000
    const waiting = large && at % 7 === 0

    // THE STATES THE SCHEMAS ARGUE HARDEST FOR, AND WHICH HAD NEVER ONCE BEEN DRAWN. Three of
    // the enum's members existed only in the type: an e-way bill that has EXPIRED — the schema's
    // own comment says a bill that was generated is not necessarily a bill that is still good,
    // which is the whole reason the state is separate — one that was CANCELLED, and an
    // e-invoice CANCELLED, which can only happen inside twenty-four hours and is why it is its
    // own state rather than a missing IRN. Found by the independent audit on 24-08. Every
    // screen that colours or words these has been looked at against 'generated' and 'pending'
    // and nothing else.
    //
    // ON THE LARGE ONES ONLY, because a counter sale under the threshold has no portal state to
    // expire or cancel. Deterministic, so a screenshot means the same thing twice.
    const expired = large && at % 11 === 3
    const scrapped = large && at % 13 === 5

    return of(index, party, {
      date: raised,
      dueDate: addDays(raised, 30),
      worthPaise: total,
      paidShare: settled ? 1 : partly ? 1 / 3 : 0,
      eInvoiceStatus: scrapped ? 'cancelled' : large ? (waiting ? 'pending' : 'generated') : 'notRequired',
      eWayBillStatus: scrapped
        ? 'cancelled'
        : expired
          ? 'expired'
          : large
            ? (waiting ? 'pending' : 'generated')
            : 'notRequired',
    })
  })
}

export const invoices: Invoice[] = [
  // Cash: a party with no GSTIN and no mobile. Every screen that prints a GSTIN meets this.
  of(1, 0, { date: TODAY, dueDate: TODAY, worthPaise: 452000, paidShare: 1 }),

  // Nothing paid, due today.
  of(2, 1, { date: TODAY, dueDate: TODAY, worthPaise: 1284500 }),

  // Part paid. Not a third tab — a chip that reads the balance off the arithmetic. Just under
  // half, which is what makes the balance an awkward figure rather than a round one.
  of(3, 3, { date: '2026-08-04', dueDate: '2026-09-03', worthPaise: 1284500, paidShare: 0.467 }),

  // Cancelled. Keeps its number and its total; the number is never reused.
  of(4, 4, { date: '2026-07-28', dueDate: '2026-08-27', worthPaise: 96000, cancelledAt: '2026-07-29' }),

  // Overdue by months, and part paid as well — the two states are independent.
  of(5, 5, { date: '2026-02-11', dueDate: '2026-03-13', worthPaise: 8734000, paidShare: 0.115 }),

  // Paid late: settled, but its due date is long past. Nothing should call it overdue.
  of(6, 6, { date: '2026-01-09', dueDate: '2026-02-08', worthPaise: 233400, paidShare: 1 }),

  // Eighteen hundred rows, which release 1 must open cold. NO TARGET: what eighteen hundred
  // lines come to IS what it is worth, and the figure written here before said 7,11,553.00
  // against a taxable of 74,33,113.92 — out by a factor of ten in the one invoice whose rows
  // anybody would actually add up.
  of(7, 2, {
    date: '2026-08-18',
    dueDate: '2026-09-17',
    rows: invoiceOf(1800).rows,
    // Well over the e-invoice threshold and a full lorry, so both apply and both are waiting.
    eInvoiceStatus: 'pending',
    eWayBillStatus: 'pending',
  }),

  ...theRestOfTheYear(),
]
