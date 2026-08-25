// What the screen sends when an invoice leaves it, built in ONE place.
//
// IT WAS INLINE IN THE SAVE, and Hold needs exactly the same object — the whole point of putting
// an invoice aside is that what comes back is what was on the screen. Two places building a draft
// is two places to forget the narration, which is a fault this file's own shape already records:
// the draft used to carry the party and the rows and nothing else, so the charges, the note and
// the rounding were dropped on the floor at the moment of saving.
//
// IT READS THE STORE ITSELF rather than taking fifteen arguments. The store is the invoice; a
// builder that has to be handed every field is a second list of what an invoice is made of.

import type { InvoiceDraft } from '../../data/schema/invoice'
import type { Party } from '../../data/schema/party'
import { useInvoice } from './store'

/** Null when there is nothing to send: no party, or no line with an item on it. Both are the
 * screen's own well-formedness questions, and both are asked here so Save and Hold cannot
 * disagree about what counts as an invoice. */
export function draftFromStore(): { draft: InvoiceDraft; party: Party } | null {
  const state = useInvoice.getState()
  if (state.party === null) return null
  // The padding rows the grid keeps under the cursor are not part of the invoice. They go
  // without asking — nobody typed them and nobody would miss them.
  const rows = state.rows.filter((row) => row.itemId !== null)
  if (rows.length === 0) return null

  return {
    party: state.party,
    draft: {
      partyId: state.party.id,
      partyName: state.party.name,
      eInvoiceStatus: state.eInvoice ? 'pending' : 'notRequired',
      eWayBillStatus: state.eWayBill ? 'pending' : 'notRequired',
      rows,
      sundries: state.sundries.filter((row) => row.sundryId !== null),
      narration: state.narration,
      narrationPrinted: state.narrationPrinted,
      roundOffOn: state.roundOffOn,
      // A COPY, because the draft's shape is a plain array and the store holds a frozen one.
      attachments: [...state.attachments],
    },
  }
}
