// The invoices put aside, invented like everything else in this folder.
//
// IN MEMORY, AND THAT IS THE HONEST HALF OF THE PROMISE. The product document says a held invoice
// survives logout, closing the application and a power failure. That is durable storage, it has no
// backend behind it, and it is filed for stakeholders. What is built is the SHAPE and the whole
// behaviour on top of it — put aside, list, bring back, drop — so the dev team stitches real
// storage behind the same four calls and nothing on any screen moves.
//
// NOT `localStorage`, deliberately. Reaching for it here would make the front end the thing that
// decided where held invoices live, which is exactly the decision this file is not allowed to
// make — and it would put a promise on screen that a second browser or a second machine breaks
// the moment anybody tries it.

import type { InvoiceDraft } from '../schema/invoice'
import type { HeldInvoice } from '../schema/held'
import { refuse } from '../schema/refusal'

let held: HeldInvoice[] = []
let nextId = 1

/** THE FOUR CALLS, BESIDE THE THING THEY ARE ABOUT. They were written out in `adapter.ts`, which
 * crossed the 250-line cap the day the third of them landed — and the cap was right about which
 * half had grown: that file is the seam, and holding an invoice aside is a subject with its own
 * state, its own rules and its own file already. The adapter spreads these in. */
export const heldCalls = {
  async holdInvoice(draft: InvoiceDraft) {
    // THE INSTANT COMES FROM THE ADAPTER, not from the screen. A front end stamping a time is a
    // front end deciding what "now" is on a machine whose clock nobody checked.
    return holdDraft(draft, new Date().toISOString())
  },

  async listHeld() {
    return heldInvoices()
  },

  async resumeHeld(id: string) {
    const found = takeHeld(id)
    if (found === undefined) return refuse('missing', 'That held invoice is not there any more.')
    return found
  },

  async discardHeld(id: string) {
    dropHeld(id)
    return null
  },
}

function holdDraft(draft: InvoiceDraft, heldAt: string): HeldInvoice {
  const one: HeldInvoice = {
    id: `held-${nextId}`,
    heldAt,
    partyName: draft.partyName,
    lines: draft.rows.length,
    draft,
  }
  nextId += 1
  held = [one, ...held]
  return one
}

/** Newest first — the one you just put down is the one you are most likely to want back. */
function heldInvoices(): HeldInvoice[] {
  return [...held]
}

function takeHeld(id: string): HeldInvoice | undefined {
  const found = held.find((one) => one.id === id)
  if (found === undefined) return undefined
  // TAKING IT BACK REMOVES IT. A held invoice you have resumed is the invoice on the screen, and
  // leaving a copy behind means somebody saves it twice — once from the screen and once from the
  // chooser they forgot they had left it in.
  held = held.filter((one) => one.id !== id)
  return found
}

function dropHeld(id: string): void {
  held = held.filter((one) => one.id !== id)
}
