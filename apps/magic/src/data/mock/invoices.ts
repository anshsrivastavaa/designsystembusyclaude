// The sample invoices a listing screen reads.
//
// AWKWARD CASES ON PURPOSE. This mock is the specification the backend team will read, so it
// carries the invoices that break screens rather than the ones that decorate them: a party
// with no GSTIN, nothing paid, part paid, cancelled, months overdue, and one of eighteen
// hundred rows. A mock made only of happy invoices is a screen that has never been tested.

import type { Invoice } from '../schema/invoice'
import { invoiceOf } from './lines'
import { parties } from './parties'

const TODAY = '2026-08-20'

function of(
  index: number,
  partyIndex: number,
  overrides: Partial<Invoice> & { date: string; dueDate: string; totalPaise: number },
): Invoice {
  const party = parties[partyIndex]!
  const rows = overrides.rows ?? invoiceOf(6).rows
  return {
    id: `invoice-${index}`,
    number: `INV/2026/${String(index).padStart(4, '0')}`,
    partyId: party.id,
    partyName: party.name,
    paidPaise: 0,
    cancelledAt: null,
    // Most invoices need neither, and that is an answer rather than a gap: the e-invoice
    // threshold and the distance an e-way bill covers leave the ordinary counter sale out of
    // both. The ones that do need them say so, below.
    eInvoiceStatus: 'notRequired',
    eWayBillStatus: 'notRequired',
    // WORKED OUT ONCE, HERE, because here is where an invoice comes into existence. The real
    // backend computes the same two before it stores the invoice; no screen recomputes them.
    ...summed(rows),
    rows,
    ...overrides,
  }
}

/** What the rows come to before tax, and the tax on them.
 *
 * The listing used to reduce over `rows` for both, while the schema says a listing reads the
 * header and never opens the rows. That is one figure worked out in two places, which is one
 * figure with two answers the day either side changes. It is worked out here instead — where the
 * invoice is built — and every screen reads the field. */
export function summed(rows: Invoice['rows']): { taxablePaise: number; taxPaise: number } {
  return {
    taxablePaise: rows.reduce((sum, row) => sum + row.amountPaise, 0),
    taxPaise: rows.reduce((sum, row) => sum + Math.round((row.amountPaise * row.taxPercent) / 100), 0),
  }
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

    return of(index, party, {
      date: raised,
      dueDate: addDays(raised, 30),
      totalPaise: total,
      paidPaise: settled ? total : partly ? Math.round(total / 3) : 0,
      eInvoiceStatus: large ? (waiting ? 'pending' : 'generated') : 'notRequired',
      eWayBillStatus: large ? (waiting ? 'pending' : 'generated') : 'notRequired',
    })
  })
}

export const invoices: Invoice[] = [
  // Cash: a party with no GSTIN and no mobile. Every screen that prints a GSTIN meets this.
  of(1, 0, { date: TODAY, dueDate: TODAY, totalPaise: 452000, paidPaise: 452000 }),

  // Nothing paid, due today.
  of(2, 1, { date: TODAY, dueDate: TODAY, totalPaise: 1284500 }),

  // Part paid. Not a third tab — a chip that reads "balance 6,845.00" from the arithmetic.
  of(3, 3, { date: '2026-08-04', dueDate: '2026-09-03', totalPaise: 1284500, paidPaise: 600000 }),

  // Cancelled. Keeps its number and its total; the number is never reused.
  of(4, 4, { date: '2026-07-28', dueDate: '2026-08-27', totalPaise: 96000, cancelledAt: '2026-07-29' }),

  // Overdue by months, and part paid as well — the two states are independent.
  of(5, 5, { date: '2026-02-11', dueDate: '2026-03-13', totalPaise: 8734000, paidPaise: 1000000 }),

  // Paid late: settled, but its due date is long past. Nothing should call it overdue.
  of(6, 6, { date: '2026-01-09', dueDate: '2026-02-08', totalPaise: 233400, paidPaise: 233400 }),

  // Eighteen hundred rows, which release 1 must open cold.
  of(7, 2, {
    date: '2026-08-18',
    dueDate: '2026-09-17',
    totalPaise: 71155300,
    rows: invoiceOf(1800).rows,
    // Well over the e-invoice threshold and a full lorry, so both apply and both are waiting.
    eInvoiceStatus: 'pending',
    eWayBillStatus: 'pending',
  }),

  ...theRestOfTheYear(),
]
