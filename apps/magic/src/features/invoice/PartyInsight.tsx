// The pieces the party panel is built from, and the one sentence it opens with.
//
// Its own file because the panel had reached the point where the ARRANGEMENT and the PARTS were
// competing for the same two hundred lines — and the verdict is the piece most likely to be
// argued about, so it is worth being able to find.

import { dayText } from '../../lib/day'
import { formatPaise } from '../../lib/money'
import type { PartyInsights, PartyTransaction } from '../../data/schema/insights'

/** ONE SENTENCE, WRITTEN FROM THE COUNTS, and it leads the panel.
 *
 * WORST THING FIRST. A person opening this is deciding whether to bill, so the sentence answers
 * that and not "here is a summary". The order is the order of consequence: a cancelled
 * registration you cannot claim against, then money already late, then the limit, then the
 * ordinary good news.
 *
 * IT NEVER SAYS THE GRADE. The letter is beside it and repeating it in words spends the one
 * line anybody reads on something they already know. */
export function verdictOf(known: PartyInsights): string {
  if (known.cappedBy === 'gstin') {
    const rest = known.billsLate === 0 && known.overdueBills === 0 ? ' Everything else about them is good.' : ''
    if (known.gstinStatus === 'cancelled') {
      const when = known.gstinCancelledOn === '' ? '' : ` on ${dayText(known.gstinCancelledOn)}`
      return `Their GSTIN was cancelled${when}.${rest}`
    }
    // Suspended is not inactive and must not be read out as it: a suspension is the portal
    // holding a live registration, and it is the one of the three that can come back.
    if (known.gstinStatus === 'suspended') return `Their GSTIN is suspended.${rest}`
    return `Their GSTIN is inactive.${rest}`
  }
  if (known.billsTotal === 0) return 'New customer — nothing to go on yet.'
  if (known.overdueBills > 0) {
    const bills = known.overdueBills === 1 ? 'One bill is' : `${known.overdueBills} bills are`
    return `${bills} past due, the oldest by ${known.oldestOverdueDays} days.`
  }
  if (known.creditLimitPaise > 0 && known.outstandingPaise >= known.creditLimitPaise * 0.8) {
    return `They have used ${formatPaise(known.outstandingPaise)} of a ${formatPaise(known.creditLimitPaise)} limit.`
  }
  if (known.billsLate > 0) return `Pays, but ${known.billsLate} of ${known.billsTotal} bills went past their date.`
  return known.averageDaysToPay === null
    ? 'Nothing outstanding.'
    : `Pays on time — ${known.averageDaysToPay} days on average.`
}

/** One of the four figures at the top. A label, a number, and at most one qualifying phrase. */
export function Figure({ label, value, note }: { label: string; value: string; note?: string | undefined }) {
  return (
    <div className="rounded-card border border-stroke px-3 py-2">
      <p className="text-caps uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-label text-ink">{value}</p>
      {note === undefined ? null : <p className="text-sm text-ink-secondary">{note}</p>}
    </div>
  )
}

/** One criterion: the name, a bar for shape, and the fact in words.
 *
 * THE BAR IS NOT A SCORE AND CARRIES NO NUMBER. It is there so five rows can be compared with
 * one glance — which is the only thing a bar is better at than a sentence — and it is drawn in
 * ink rather than in colour, because a row of five coloured bars is the report card this panel
 * is deliberately not. */
export function Criterion({ label, filled, children }: { label: string; filled: number; children: string }) {
  const width = `${Math.round(Math.max(0, Math.min(1, filled)) * 100)}%`
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 text-ink-secondary">{label}</span>
      <span aria-hidden className="h-1 w-20 shrink-0 overflow-hidden rounded-pill bg-surface-sunken">
        <span className="block h-full rounded-pill bg-ink-muted" style={{ width }} />
      </span>
      <span className="min-w-0 truncate text-ink">{children}</span>
    </div>
  )
}

const STATUS_WORD: Record<PartyTransaction['status'], string> = {
  paid: 'Paid',
  partly: 'Part paid',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

/** The last five. v2 has this and it is the part people actually scan — a grade is an opinion
 * and a list of what they bought and whether they paid is evidence. */
export function Transactions({ rows }: { rows: readonly PartyTransaction[] }) {
  if (rows.length === 0) return null
  return (
    <section aria-label="Last transactions" className="flex flex-col gap-2">
      <p className="text-caps uppercase tracking-wide text-ink-muted">Last {rows.length} transactions</p>
      {rows.map((row) => (
        <div key={row.id} className="flex items-baseline gap-3 border-b border-stroke pb-2 text-sm last:border-b-0">
          <span className="w-24 shrink-0 text-ink-secondary">{dayText(row.date)}</span>
          <span className="min-w-0 flex-1 truncate text-ink">{row.voucher}</span>
          <span className="shrink-0 font-label text-ink">{formatPaise(row.amountPaise)}</span>
          <span className="w-20 shrink-0 text-right text-ink-secondary">{STATUS_WORD[row.status]}</span>
        </div>
      ))}
    </section>
  )
}
