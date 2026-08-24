// What is known about a party, behind the letter on the party field.
//
// v2'S CONTENT, NOT v2'S LOOK. v2 has this right: the GSTIN and the mobile, four figures
// (ledger, outstanding, credit, overdue), the grade with its criteria, the last five
// transactions, and a way through to the full master. Journey 7 names four of them by hand.
// What it does with them is a 760-pixel modal behind a scrim, with an amber gradient band, a
// warm gradient column and a big letter — Aj's words: "very heavy and on your face". Ours is
// the same facts, quiet.
//
// FOUR RULES INSIDE THE GRADE SECTION, and they are the difference between this and a report:
//
//   1. A SENTENCE BEFORE THE SCORE. The whole point is that we noticed something. A sentence is
//      the only part of this anybody READS rather than scans, so it goes first.
//   2. THE GRADE IS SMALL, because the badge they pressed to get here already said it. v2
//      repeats it at thirty-odd pixels, which spends the panel's opening on something already
//      known.
//   3. BARS CARRY SHAPE, WORDS CARRY FACT. The bar exists so five rows can be compared at a
//      glance; the words are what is true. There is no number out of a hundred anywhere — the
//      grade is a letter and that is the whole of it.
//   4. THE CAP IS SAID IN WORDS. A grade held down that looks like a grade earned teaches
//      nothing, and knowing a GSTIN is cancelled before billing is journey 8.
//
// AND NO COLOUR EXCEPT THE BADGE. Every row tinted is what made v2's version shout.
//
// EVERY WORD IS WRITTEN HERE, FROM COUNTS. The adapter sends eighteen bills and two late; it
// never sends a sentence. A backend cannot know how this reads, cannot be re-worded when the
// design changes, and text arriving from a server has already decided what the screen may say.

import { useEffect, useState } from 'react'

import { Button } from '@busy/ui/Button'
import { Drawer } from '@busy/ui/Drawer'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { dayText } from '../../lib/day'
import { formatBalancePaise, formatPaise } from '../../lib/money'
import type { Party } from '../../data/schema/party'
import type { PartyInsights } from '../../data/schema/insights'
import { Criterion, Figure, Transactions, verdictOf } from './PartyInsight'

export function PartyDetails({ party, onClose }: { party: Party | null; onClose: () => void }) {
  const [known, setKnown] = useState<PartyInsights | null>(null)
  const [refused, setRefused] = useState<string | null>(null)

  useEffect(() => {
    if (party === null) return
    let current = true
    setKnown(null)
    setRefused(null)
    void data.partyInsights(party.id).then((answer) => {
      if (!current) return
      if (isRefusal(answer)) setRefused(answer.message)
      else setKnown(answer)
    })
    return () => {
      current = false
    }
  }, [party])

  return (
    <Drawer
      open={party !== null}
      onClose={onClose}
      title={party?.name ?? 'Party'}
      footer={
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onClose}>Open party master</Button>
        </div>
      }
    >
      {party === null ? null : (
        <div className="flex flex-col gap-5">
          {/* Who they are, in the two things anybody checks first. */}
          <p className="text-sm text-ink-secondary">
            {party.gstin === '' ? 'No GSTIN — unregistered' : party.gstin}
            {party.mobile === '' ? '' : ` · ${party.mobile}`}
            {party.city === '' ? '' : ` · ${party.city}`}
          </p>

          {refused !== null ? (
            <p role="alert" className="text-body text-danger">
              {refused}
            </p>
          ) : known === null ? (
            <p className="text-body text-ink-muted">Looking them up…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Figure label="Outstanding" value={formatBalancePaise(known.outstandingPaise)} />
                <Figure
                  label="Overdue"
                  value={known.overdueBills === 0 ? 'None' : formatPaise(known.overduePaise)}
                  note={known.overdueBills === 0 ? undefined : `oldest ${known.oldestOverdueDays} days`}
                />
                <Figure
                  label="Credit limit"
                  value={known.creditLimitPaise === 0 ? 'Not set' : formatPaise(known.creditLimitPaise)}
                />
                <Figure label="Bills" value={String(known.billsTotal)} note={known.billsTotal === 0 ? undefined : `since ${dayText(known.firstBillDate)}`} />
              </div>

              <section aria-label="Trust grade" className="flex flex-col gap-3 rounded-card border border-stroke p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-body text-ink">{verdictOf(known)}</p>
                  <span className="shrink-0 font-label text-ink-secondary">{known.grade ?? '–'}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <Criterion label="Payment record" filled={known.billsTotal === 0 ? 0 : 1 - known.billsLate / Math.max(known.billsTotal, 1)}>
                    {known.billsTotal === 0
                      ? 'No bills yet'
                      : known.billsLate === 0
                        ? `${known.billsTotal} bills, none late`
                        : `${known.billsTotal} bills, ${known.billsLate} late`}
                  </Criterion>
                  <Criterion label="Overdue bills" filled={known.overdueBills === 0 ? 1 : 0.2}>
                    {known.overdueBills === 0 ? 'None' : `${known.overdueBills} · oldest ${known.oldestOverdueDays} days`}
                  </Criterion>
                  <Criterion
                    label="Credit limit"
                    filled={known.creditLimitPaise === 0 ? 1 : 1 - Math.min(1, known.outstandingPaise / known.creditLimitPaise)}
                  >
                    {known.creditLimitPaise === 0
                      ? 'No limit set'
                      : `${formatPaise(known.outstandingPaise)} of ${formatPaise(known.creditLimitPaise)} used`}
                  </Criterion>
                  <Criterion label="Business history" filled={known.billsTotal === 0 ? 0 : Math.min(1, known.billsTotal / 50)}>
                    {known.firstBillDate === '' ? 'Nothing yet' : `${known.billsTotal} bills since ${dayText(known.firstBillDate)}`}
                  </Criterion>
                  <Criterion label="GST compliance" filled={known.gstinStatus === 'active' ? 1 : known.gstinStatus === 'none' ? 1 : 0}>
                    {known.gstinStatus === 'active'
                      ? known.filedTo === ''
                        ? 'Active'
                        : `Active, filed to ${known.filedTo}`
                      : known.gstinStatus === 'none'
                        ? 'Not registered'
                        : known.gstinStatus === 'unchecked'
                          ? 'Not checked yet'
                          : known.gstinStatus === 'cancelled'
                            ? `Cancelled ${dayText(known.gstinCancelledOn)}`
                            : known.gstinStatus === 'suspended'
                              ? 'Suspended'
                              : 'Inactive'}
                  </Criterion>
                </div>

                {known.cappedBy === null ? null : (
                  <p className="text-sm text-ink-secondary">Held at {known.grade} because of the GSTIN.</p>
                )}
              </section>

              <Transactions rows={known.transactions} />
            </>
          )}
        </div>
      )}
    </Drawer>
  )
}
