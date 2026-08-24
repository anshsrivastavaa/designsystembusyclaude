// What the sample world knows about each party, as counts.
//
// EVERYTHING HERE IS DERIVED FROM THE PARTY ITSELF, deterministically, so the same party gives
// the same answer every time and a journey can assert on it. Nothing is random: a fixture that
// changes under a test is a fixture that fails one run in ten and teaches everybody to re-run.
//
// THE GRADE ARRIVES ALREADY CAPPED. A suspended, cancelled or inactive GSTIN holds it at C
// whatever the rest of the record says, and that happens where the party is built — one place,
// so the letter is the same answer wherever it is read. What is added here is `cappedBy`, which
// names the criterion that held it, because a held C and an earned C are the same letter and the
// panel is where the difference gets explained. The screen is not allowed to work either out, or
// there are two answers to one question the day the weights change.

import { gstinIsDead, type Party } from '../schema/party'
import type { PartyInsights, PartyTransaction } from '../schema/insights'

const DAY = 24 * 60 * 60 * 1000

/** A day so many days before the given one, as ISO. */
function daysBefore(from: string, days: number): string {
  return new Date(new Date(`${from}T00:00:00Z`).getTime() - days * DAY).toISOString().slice(0, 10)
}

/** A number from a string, so the sample facts are stable and different party to party. */
function spread(seed: string, span: number): number {
  let total = 0
  for (const letter of seed) total = (total * 31 + letter.charCodeAt(0)) % 100000
  return total % span
}

const STATUSES: PartyTransaction['status'][] = ['paid', 'paid', 'partly', 'overdue', 'unpaid']

export function insightsOf(party: Party, today: string): PartyInsights {
  const seed = party.id
  const billsTotal = party.name === 'Cash' ? 0 : 8 + spread(seed, 220)
  const billsLate = Math.min(billsTotal, spread(`${seed}late`, 6))
  const overdueBills = party.overduePaise > 0 ? 1 + spread(`${seed}od`, 3) : 0

  const capped = gstinIsDead(party.gstinStatus)

  const transactions: PartyTransaction[] = Array.from({ length: Math.min(5, billsTotal) }, (_, at) => ({
    id: `${party.id}-tx-${at}`,
    date: daysBefore(today, at * 9 + 3 + spread(`${seed}${at}`, 5)),
    voucher: `Invoice ${billsTotal - at}/2026-27`,
    amountPaise: 120000 + spread(`${seed}amt${at}`, 900) * 100,
    status: STATUSES[(spread(`${seed}st${at}`, 5) + at) % STATUSES.length]!,
  }))

  return {
    partyId: party.id,
    grade: party.trustGrade,
    cappedBy: capped ? 'gstin' : null,
    billsTotal,
    billsPaid: Math.max(0, billsTotal - overdueBills),
    billsLate,
    averageDaysToPay: billsTotal === 0 ? null : 12 + spread(`${seed}avg`, 30),
    lastPaidDaysAgo: billsTotal === 0 ? null : 1 + spread(`${seed}last`, 40),
    overdueBills,
    oldestOverdueDays: overdueBills === 0 ? 0 : 8 + spread(`${seed}age`, 90),
    overduePaise: party.overduePaise,
    outstandingPaise: party.outstandingPaise,
    creditLimitPaise: party.creditLimitPaise,
    firstBillDate: billsTotal === 0 ? '' : daysBefore(today, 200 + spread(`${seed}first`, 1200)),
    gstinStatus: party.gstinStatus,
    gstinCancelledOn: party.gstinStatus === 'cancelled' ? daysBefore(today, 30 + spread(`${seed}canc`, 300)) : '',
    filedTo: party.gstinStatus === 'active' ? 'July 2026' : '',
    transactions,
  }
}
