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

export function SaveInvoice({ onReady }: { onReady?: (save: () => void) => void }) {
  const party = useInvoice((state) => state.party)
  const rows = useInvoice((state) => state.rows)
  const sundries = useInvoice((state) => state.sundries)
  const settings = useInvoice((state) => state.settings)
  const narration = useInvoice((state) => state.narration)
  const narrationPrinted = useInvoice((state) => state.narrationPrinted)
  const roundOffOn = useInvoice((state) => state.roundOffOn)
  const paidPaise = useInvoice((state) => state.paidPaise)
  const askFor = useInvoice((state) => state.askFor)
  const [saving, setSaving] = useState(false)
  const [paid, setPaid] = useState(false)
  const [eWayBill, setEWayBill] = useState(false)
  const [eInvoice, setEInvoice] = useState(false)
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
        // A draft has been near no portal. What it needs, and whether it got it, is the
        // backend's answer once the invoice exists.
        eInvoiceStatus: 'notRequired',
        eWayBillStatus: 'notRequired',
        rows: lines,
        // EVERYTHING ELSE ON THE SCREEN. The charges, the note and the rounding were all typed
        // by the operator and all dropped on the floor at the moment of saving.
        sundries: sundries.filter((row) => row.sundryId !== null),
        narration,
        narrationPrinted,
        roundOffOn,
      })
      .then((answer) => {
        if (isRefusal(answer)) {
          setRefused(answer.message)
          return
        }
        // WHAT CAME BACK IS WHAT IS TRUE, which this file's own first line has always said and
        // which it then threw away. The number and the dates are the backend's, and the
        // operator has to be shown the one their invoice actually has.
        setSaved(`Saved as ${answer.number}`)
      })
      .finally(() => {
        inFlight.current = false
        setSaving(false)
      })
  }

  // F2's LAST JUMP RUNS THIS, and that is the condition on the badge staying on the button. The
  // screen above holds the handle; this owns what saving means, including the guard that stops
  // two presses becoming two invoices.
  useEffect(() => {
    onReady?.(save)
  })

  return (
    <ActionBar
      paid={paid}
      onPaid={setPaid}
      balancePaise={balancePaise}
      eWayBill={eWayBill}
      onEWayBill={setEWayBill}
      eInvoice={eInvoice}
      onEInvoice={setEInvoice}
      onHold={() => undefined}
      onSave={save}
      saving={saving}
      message={saved ?? refused}
      refused={refused !== null}
    />
  )
}
