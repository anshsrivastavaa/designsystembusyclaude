// Save is never disabled.
//
// It used to refuse by going dead with "Pick a party first" beside it, which is a control
// telling you no and leaving you to work out where to go. Pressing it now puts the error on
// the thing to correct and the cursor in it. Errors say what to correct, on the thing being
// corrected — the same reasoning as the delete control.
//
// What comes back from the adapter is authoritative. Everything the screen worked out on the
// way — line amounts, totals — is for the person typing, and is not what makes it true.

import { useEffect, useRef, useState } from 'react'

import { ActionBar } from './ActionBar'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { invoiceBreakdown } from '../../lib/totals'
import { placeOfSupply } from '../../lib/tax'
import { useInvoice } from './store'
import { eWayIsFilled } from './transport'
import { runTail, tailFor, type Landing, type TailSwitches } from './afterSave'
import { HeldInvoices } from './HeldInvoices'
import { useHolding } from './holding'
import { today } from '../../lib/day'

export function SaveInvoice({
  onReady,
  onHoldReady,
  onOpenTransport,
  onLand,
}: {
  onReady?: (save: () => void) => void
  /** Hold's own doing, handed up so the "before you go" prompt can offer it. The same shape as
   * `onReady`, and for the same reason: the prompt is on the screen above and has no business
   * reaching into this bar. */
  onHoldReady?: (hold: () => void) => void
  /** Where to go once the save and its tail are done. The SCREEN owns that, because only the
   * shell above it knows what "the listing" is — this feature may not import from `app/`. */
  onLand?: (landing: Landing) => void
  /** Where "E-Way needs the transport details" sends somebody. The DRAWER belongs to the screen
   * above, which is the only thing that knows what else is open, so this asks rather than
   * reaching for it. */
  onOpenTransport?: () => void
}) {
  const party = useInvoice((state) => state.party)
  const rows = useInvoice((state) => state.rows)
  const sundries = useInvoice((state) => state.sundries)
  const settings = useInvoice((state) => state.settings)
  const narration = useInvoice((state) => state.narration)
  const narrationPrinted = useInvoice((state) => state.narrationPrinted)
  const roundOffOn = useInvoice((state) => state.roundOffOn)
  const paidPaise = useInvoice((state) => state.paidPaise)
  const attachments = useInvoice((state) => state.attachments)
  const askFor = useInvoice((state) => state.askFor)
  const [saving, setSaving] = useState(false)
  const [paid, setPaid] = useState(false)
  // WHAT RUNS AFTER THE SAVE, as switches rather than as a menu of rows. Local, because unlike the
  // compliance pair these are drawn in exactly one place and nothing else asks about them.
  const [tail, setTail] = useState({ print: false, email: false, whatsapp: false })
  // WHERE THE SAVE LANDS is a setting behind the caret now, not a second button on the bar. Two
  // primary actions on one bar was the thing the split button takes away.
  const [landing, setLanding] = useState<Landing>('new')
  // THE TWO SWITCHES COME FROM THE STORE, not from here and not through the bar. They are drawn
  // in the action bar and again in the transport drawer — the same two switches seen from two
  // rooms — and a second copy is how one of them ends up lying about the other. What this file
  // needs them for is the SAVE, which is a different question from who draws them.
  const eWayBill = useInvoice((state) => state.eWayBill)
  const eInvoice = useInvoice((state) => state.eInvoice)
  const transport = useInvoice((state) => state.transport)
  // WHAT IS LEFT TO COLLECT, worked out rather than hard-coded to zero — which made the
  // "partly paid" chip unreachable for every invoice ever opened. A loaded invoice brings what
  // has been received; the breakdown says what it comes to.
  const place = placeOfSupply(settings.companyStateCode, party?.gstin ?? '', settings.companyStateCode)
  const breakdown = invoiceBreakdown({
    rows,
    sundries,
    settings: { ...settings, roundOff: { ...settings.roundOff, on: roundOffOn } },
    place,
  })
  const balancePaise = Math.max(0, breakdown.grandTotalPaise - paidPaise)
  const [saved, setSaved] = useState<string | null>(null)
  // HOLD LIVES BESIDE SAVE because they are the two ways an invoice leaves the screen, and both
  // report through the same line of text on the bar.
  const holding = useHolding((message) => { setRefused(null); setSaved(message) })
  const inFlight = useRef(false)
  const [refused, setRefused] = useState<string | null>(null)

  function save() {
    setSaved(null)
    setRefused(null)

    // What WE check is whether the invoice is well-formed: is the party filled in, is there
    // a line. Whether it is allowed — credit limit, stock, a GSTIN that exists — is theirs,
    // and comes back from the adapter.
    if (party === null) {
      askFor('party', 'Pick a party before saving this invoice.')
      return
    }
    const lines = rows.filter((row) => row.itemId !== null)
    if (lines.length === 0) {
      askFor('item', 'Add at least one item before saving this invoice.')
      return
    }

    // E-WAY ON WITH THE TRANSPORT EMPTY OPENS THE DRAWER RATHER THAN REFUSING. The bill cannot be
    // raised without who is carrying it, in what, and how far — so the answer to "you cannot do
    // that" is the place the answers go, with the invoice untouched behind it. Which fields those
    // are is `E_WAY_NEEDS`, named once in transport.ts, and it is a guess until somebody rules.
    if (eWayBill && !eWayIsFilled(transport)) {
      setRefused('An E-Way Bill needs the transporter, the vehicle and the distance. Fill them in and save again.')
      onOpenTransport?.()
      return
    }

    // A REF, NOT STATE. `saving` in this closure is whatever it was when the handler was made,
    // so two clicks in one tick both read false and both saved — two invoices from one press.
    if (inFlight.current) return
    inFlight.current = true
    setSaving(true)
    void data
      // The padding rows the grid keeps under the cursor are not part of the invoice. They
      // go without asking — nobody typed them and nobody would miss them.
      // A draft has no number and no date until it is saved — those come back from the
      // backend, which is authoritative. See docs/backend-assumptions.md.
      .saveInvoice({
        partyId: party.id,
        partyName: party.name,
        // ON AT SAVE MEANS GENERATED AT SAVE, and `pending` is the only honest word for it here.
        // Whether a document NEEDS one of these is the portal's answer, told to the backend — the
        // schema's own comment says so — and no front end can work it out. So what these carry is
        // an INTENTION: on means "raise it", off means the backend was never asked to.
        // Both were hard-coded to `notRequired` until 25-08, which meant the two switches in the
        // action bar changed nothing at all: they moved, and the saved invoice said the same
        // thing either way.
        eInvoiceStatus: eInvoice ? 'pending' : 'notRequired',
        eWayBillStatus: eWayBill ? 'pending' : 'notRequired',
        rows: lines,
        // EVERYTHING ELSE ON THE SCREEN. The charges, the note and the rounding were all typed
        // by the operator and all dropped on the floor at the moment of saving.
        sundries: sundries.filter((row) => row.sundryId !== null),
        narration,
        narrationPrinted,
        roundOffOn,
        // A COPY, because the draft's shape is a plain array and the store holds a frozen one.
        attachments: [...attachments],
      })
      .then((answer) => {
        if (isRefusal(answer)) {
          // THE CURSOR GOES WHERE THEY SAY, WHEN THEY SAY. A refusal may name the field it is
          // about, and being told what is wrong and then having to find it is most of the work
          // of being told — which is the same reasoning the party field's own error already
          // runs on. Nothing had ever exercised this: the mock never set `field`, so a refusal
          // could only ever be shown beside the button.
          //
          // ONLY THE TWO FIELDS THIS SCREEN CAN PLACE A CURSOR IN. A refusal about anything
          // else still shows beside the button, which is worse and is honest — a screen that
          // silently swallowed an unknown field would report a state it is not in.
          if (answer.field === 'party' || answer.field === 'item') {
            askFor(answer.field, answer.message)
            return
          }
          setRefused(answer.message)
          return
        }
        // WHAT CAME BACK IS WHAT IS TRUE, which this file's own first line has always said and
        // which it then threw away. The number and the dates are the backend's, and the
        // operator has to be shown the one their invoice actually has.
        setSaved(`Saved as ${answer.number}`)

        // THE TAIL RUNS AFTER, AND A FAILURE IN IT NEVER SENDS THE INVOICE AGAIN. The save has
        // already happened by the time any of this starts, so a step that fails stops the chain,
        // names itself, and says the invoice is safe — otherwise an operator reads "could not
        // print" as "not saved" and presses Save a second time.
        const switches: TailSwitches = { eInvoice, eWay: eWayBill, ...tail }
        void runTail(tailFor(switches), attemptStep).then((result) => {
          if (result.message !== null) setRefused(result.message)
          else onLand?.(landing)
        })
      })
      .finally(() => {
        inFlight.current = false
        setSaving(false)
      })
  }

  // NONE OF THE THREE HAS AN ADAPTER METHOD, AND SAYING SO IS THE POINT. Printing, emailing and
  // sending on WhatsApp all need something behind the seam that does not exist — there is no
  // `data.printInvoice`. They report success and do nothing, which is a no-op named out loud
  // rather than a screen pretending. The two portal postings are different: the backend is told
  // by the SAVE, through the `pending` status, so there is nothing left for the tail to do and
  // reporting success is the truth.
  const attemptStep = async () => true

  // F2's LAST JUMP RUNS THIS, and that is the condition on the badge staying on the button. The
  // screen above holds the handle; this owns what saving means, including the guard that stops
  // two presses becoming two invoices.
  useEffect(() => {
    // F2 RUNS THE FACE, which is the whole of what makes the badge on it honest.
    onReady?.(() => save())
    onHoldReady?.(() => { void holding.hold() })
  })

  return (
    <>
      <ActionBar
        paid={paid}
        onPaid={setPaid}
        balancePaise={balancePaise}
        onHold={() => { void holding.hold() }}
        onSave={save}
        tail={tail}
        onTailSwitch={(key, on) => setTail((was) => ({ ...was, [key]: on }))}
        landing={landing}
        onLanding={setLanding}
        saving={saving}
        message={saved ?? refused}
        refused={refused !== null}
      />
      {/* THE CHOOSER ONLY OPENS WHEN THERE IS A CHOICE. Ctrl+H with one held invoice brings it
          straight back; with several this opens, because "the most recent" is a guess about which
          one they meant. */}
      <HeldInvoices
        open={holding.choosing}
        onClose={() => holding.setChoosing(false)}
        held={holding.held}
        today={today()}
        onResume={(id) => { void holding.resume(id, null) }}
        onDiscard={(id) => { void holding.discard(id) }}
      />
    </>
  )
}
