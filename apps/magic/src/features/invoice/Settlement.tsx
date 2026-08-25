// Settling the invoice: what is owed, how it arrived, and what is left.
//
// A POPOVER, ruled by Aj on 24-08. Three sections with the payment rows inside them, hung off
// the control beside the total it fills. Split is NOT in here — twenty-four instalments inside a
// popover is the reason, and Split has its own surface — and leaving it out is what keeps this
// short enough to stay one.
//
// THE ORDER IS THE ORDER A PERSON THINKS, and it is not taste: what is owed, how it arrived,
// what is left. A panel that opens on the credits makes somebody scroll up to find out what they
// are settling against.
//
// THE SECTION LABEL IS THE DOOR TO INVOICE SETTINGS, not a gear. The header fields already work
// this way, and a gear in a corner is a second grammar for "there is more behind this" on a
// screen that already has one.
//
// EVERY FIGURE IN HERE IS INVENTED IN data/mock/ AND ITS SHAPE IS IN docs/backend-assumptions.md.
// This front end may invent the numbers. It may not invent a second way to work them out — which
// is why what is left of a credit arrives on the credit and is never worked out here.

import { useEffect, useState } from 'react'

import { Popover } from '@busy/ui/Popover'
import { Tabs } from '@busy/ui/Tabs'
import { Button } from '@busy/ui/Button'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { CREDIT_TYPE_LABEL, type Credit } from '../../data/schema/credit'
import { formatPaise, toPaise } from '../../lib/money'
import { useInvoice } from './store'
import { settle } from './settlementSums'
import { SettlementRow } from './SettlementRow'

const MODES = [
  { value: 'cash' as const, label: 'Cash' },
  { value: 'bank' as const, label: 'Bank' },
  { value: 'upi' as const, label: 'UPI' },
]

function Section({ label, children, className = '' }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h3 className="mb-2 shrink-0 text-caps font-strong tracking-wide text-ink-secondary uppercase">{label}</h3>
      {children}
    </section>
  )
}

export function Settlement({
  open,
  onClose,
  anchorRef,
  owedPaise,
  onOpenSettings,
}: {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  /** What the invoice comes to. Handed in rather than worked out again here, because it is
   * already worked out once for the breakdown and twice is how two figures disagree. */
  owedPaise: number
  onOpenSettings: () => void
}) {
  const party = useInvoice((state) => state.party)
  const adjustments = useInvoice((state) => state.adjustments)
  const payingPaise = useInvoice((state) => state.payingPaise)
  const paymentMode = useInvoice((state) => state.paymentMode)
  const tenderedPaise = useInvoice((state) => state.tenderedPaise)
  const toggleCredit = useInvoice((state) => state.toggleCredit)
  const setAdjustment = useInvoice((state) => state.setAdjustment)
  const setPaying = useInvoice((state) => state.setPaying)
  const setPaymentMode = useInvoice((state) => state.setPaymentMode)
  const setTendered = useInvoice((state) => state.setTendered)
  const setPaidPaise = useInvoice((state) => state.setPaidPaise)
  const [credits, setCredits] = useState<Credit[]>([])
  const [refused, setRefused] = useState<string | null>(null)

  // ASKED WHEN THE PARTY CHANGES, not when the panel opens. A person who opens it, closes it and
  // opens it again is looking at the same ledger; asking twice is a request nobody needed and a
  // list that flickers empty on the way back.
  useEffect(() => {
    if (party === null) {
      setCredits([])
      return
    }
    let current = true
    void data.partyCredits(party.id).then((answer) => {
      if (!current) return
      if (isRefusal(answer)) {
        setRefused(answer.message)
        return
      }
      setRefused(null)
      setCredits(answer)
    })
    return () => { current = false }
  }, [party])

  const answer = settle({ owedPaise, adjustments, payingPaise, tenderedPaise, mode: paymentMode })

  return (
    <Popover open={open} onClose={onClose} anchorRef={anchorRef} align="end" height="tall" label="Settle this invoice">
      {/* THREE BANDS, AND THE MIDDLE ONE IS THE ONLY ONE THAT SCROLLS. The popover is capped at a
          height, so a panel taller than that simply loses its bottom — measured on the running
          screen, where "What is left" and both actions were cut off entirely and nothing said so.
          The figure a person is deciding against and the button that commits it may never be
          below a fold, so they are pinned and the credit list gives way instead. */}
      {/* THREE BANDS, AND ONLY THE CREDIT LIST GIVES WAY. What is owed and what is left stay put,
          because the figure a person is deciding against and the button that commits it may never
          be below a fold. The payment rows are pinned with them since B's taller popover landed.
          THE LIST TAKES WHAT IS LEFT AND HAS NO CAP OF ITS OWN. It was capped while the panel had
          to fit a dropdown's height, and the cap plus a `flex-1` wrapper starved it: four credits
          drew as two with nothing to say the other two were there. */}
      <div className="flex min-h-0 w-120 flex-1 flex-col text-body">
        <Section label="What is owed" className="shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-baseline justify-between gap-6">
            {/* NEVER "party payable". That is a ledger phrase meaning what the party owes across
                every bill, not this one, and using it on an invoice is what made three people
                read it three different ways. */}
            <span className="text-ink">Invoice total</span>
            <span className="font-total text-ink">{formatPaise(answer.owedPaise)}</span>
          </div>
        </Section>

        <Section
          className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-stroke px-4 py-3"
          label={
            // THE LABEL IS THE DOOR, the way the header fields work. Not a gear.
            <button type="button" onClick={onOpenSettings} className="rounded-control uppercase hover:text-ink focus-ring">
              How it arrived
            </button>
          }
        >
          {/* THE CREDIT LIST IS THE ONLY THING THAT GIVES WAY. It is the part that can be any
              length — a party with nine receipts against one with none — and everything else in
              the panel is a fixed number of lines. WHAT IS OWED and WHAT IS LEFT stay pinned,
              because the figure a person is deciding against and the button that commits it may
              never be below a fold.
              THE PAYMENT ROWS ARE PINNED WITH THEM AGAIN. They were inside this box as an interim,
              because the panel needed about a hundred pixels more than `Popover` allowed and
              something had to be under a fold. Session B landed `height="tall"` on 25-08 and the
              interim is over. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
          {refused !== null ? (
            <p role="alert" className="text-sm text-danger">{refused}</p>
          ) : credits.length === 0 ? (
            // Said in words rather than left blank. An empty area reads as a panel that has not
            // finished loading; a sentence reads as an answer.
            <p className="text-sm text-ink-secondary">
              {party === null ? 'Pick a party to see what they have against them.' : 'Nothing on account for this party.'}
            </p>
          ) : (
            // THE CREDIT LIST IS THE ONLY THING THAT GIVES WAY. It is the part that can be any
            // length — a party with nine receipts against one with none — and everything else in
            // the panel is a fixed number of lines. With the whole section scrolling instead, the
            // running screen put Tendered and Change below a fold with nothing to say they were
            // there.
            <ul className="flex flex-col gap-1">
              {credits.map((credit) => (
                <SettlementRow
                  key={credit.id}
                  credit={credit}
                  label={CREDIT_TYPE_LABEL[credit.type]}
                  adjustedPaise={adjustments[credit.id]}
                  onToggle={(on) => toggleCredit(credit, on, owedPaise)}
                  onAmount={(typed) => setAdjustment(credit, toPaise(typed), owedPaise)}
                />
              ))}
            </ul>
          )}
          </div>

          <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-stroke pt-3">
            <Tabs
              look="tray"
              label="How it is being paid"
              value={paymentMode}
              onChange={(mode) => setPaymentMode(mode)}
              options={MODES}
            />
            <label className="flex items-center justify-between gap-3">
              <span className="text-ink-secondary">Paying now</span>
              <input
                inputMode="decimal"
                value={payingPaise === 0 ? '' : formatPaise(payingPaise)}
                onChange={(event) => setPaying(toPaise(event.target.value))}
                className="h-control-sm w-32 rounded-control border border-stroke bg-surface px-2 text-right focus-ring"
              />
            </label>

            {/* CASH ONLY, AND NEITHER FIGURE IS EVER SAVED. What a customer handed over is how
                the change was worked out at the counter; it is not a fact about the invoice, and
                nobody hands back three rupees on a bank transfer. */}
            {paymentMode === 'cash' ? (
              <>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-ink-secondary">Tendered</span>
                  <input
                    inputMode="decimal"
                    value={tenderedPaise === 0 ? '' : formatPaise(tenderedPaise)}
                    onChange={(event) => setTendered(toPaise(event.target.value))}
                    className="h-control-sm w-32 rounded-control border border-stroke bg-surface px-2 text-right focus-ring"
                  />
                </label>
                <div className="flex items-baseline justify-between gap-3 text-ink-secondary">
                  <span>Change</span>
                  <span className="w-32 pr-2 text-right">{formatPaise(answer.changePaise)}</span>
                </div>
              </>
            ) : null}
          </div>
        </Section>

        <Section label="What is left" className="shrink-0 border-t border-stroke px-4 pt-3 pb-4">
          <div className="flex items-baseline justify-between gap-6 text-ink-secondary">
            <span>Adjusted</span>
            <span>{formatPaise(answer.adjustedPaise + answer.payingPaise)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-6">
            <span className="font-label text-ink">Balance receivable</span>
            <span className="text-lg font-total text-ink">₹{formatPaise(answer.balancePaise)}</span>
          </div>

          {/* Two actions, and Escape does what Cancel does. Applying is what makes the figures
              true on the invoice: it writes what has arrived into the same field a loaded invoice
              brings, so the "partly paid" chip and the Paid tab move with it rather than being a
              second answer to the same question. Closing without it changes nothing. */}
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPaidPaise(answer.adjustedPaise + answer.payingPaise)
                onClose()
              }}
            >
              Apply
            </Button>
          </div>
        </Section>
      </div>
    </Popover>
  )
}
