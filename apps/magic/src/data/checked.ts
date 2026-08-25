// Every answer from the adapter, checked against the schema that describes it.
//
// WHY A WRAPPER AND NOT A CALL IN EACH SCREEN. There is one seam, and this is it. A check
// written into each screen is a check somebody forgets in the fourteenth screen; a check on
// the seam covers every call that will ever be made, including the ones nobody has written.
//
// AND A REJECTION IS A REFUSAL TOO, WHICH IS THE HALF THAT WAS MISSING. Nothing in the whole
// application caught a rejected promise — not one `.catch` anywhere — so a backend that was
// unreachable left the listing on "Loading invoices…" for ever, with the real error in a console
// nobody has open. The fix is not a catch at every call site: that is a branch somebody forgets on
// the fourteenth screen, and it is the same argument this file already makes about validation.
// The seam catches, and converts, so NOTHING ABOVE IT EVER SEES A REJECTED PROMISE. There is no
// branch left to remember.
//
// A FAILURE IS A REFUSAL, NOT A THROW. The screens already handle a refusal — they have to, to
// compile — so bad data arrives as a sentence somebody can read rather than as a blank screen
// and a console message nobody sees. What it says is deliberately about US: the operator did
// nothing wrong and cannot fix it, so it tells them to report it rather than to try again.

import { z } from 'zod'

import type { DataAdapter, Answer } from './adapter'
import { attachmentSchema } from './schema/attachment'
import { invoiceSchema } from './schema/invoice'
import { itemSchema } from './schema/item'
import { creditSchema } from './schema/credit'
import { heldInvoiceSchema } from './schema/held'
import { partySchema } from './schema/party'
import { partyInsightsSchema } from './schema/insights'
import { invoiceSettingsSchema } from './schema/settings'
import { sundryMasterSchema } from './schema/sundry'
import { isRefusal, refuse } from './schema/refusal'

function against<Value>(schema: z.ZodType<Value>, what: string) {
  return async (answer: Answer<Value>): Promise<Answer<Value>> => {
    if (isRefusal(answer)) return answer
    const read = schema.safeParse(answer)
    if (read.success) return read.data
    // The first problem, named. A list of twelve is for a log; a person needs one thing.
    const first = read.error.issues[0]
    return refuse(
      'malformed',
      `The ${what} that came back is not the shape this screen expects (${first?.path.join('.') || 'the whole answer'}: ${first?.message ?? 'wrong'}). Nothing is wrong with what you typed — please report it.`,
    )
  }
}

/** Every method of a built adapter, with a rejection turned into a refusal.
 *
 *  IT WRAPS THE OBJECT RATHER THAN EACH LINE. Twenty `.catch`es written by hand is twenty chances
 *  to miss one, and the one missed is invisible until a backend falls over. This covers every
 *  method the adapter has, including the ones nobody has written yet.
 *
 *  THE MESSAGE SAYS TRY AGAIN, which is the opposite of what a malformed answer says. A shape that
 *  came back wrong will come back wrong again and the operator can do nothing about it; a server
 *  that could not be reached very often can be, a moment later. Telling somebody to report a
 *  network blip is telling them to waste their time and ours. */
function neverRejects(built: DataAdapter): DataAdapter {
  const caught = Object.entries(built).map(([name, call]) => [
    name,
    // The signatures differ per method and every one of them returns `Promise<Answer<T>>`, of
    // which `Refusal` is always a member — so the cast is about the argument lists and not about
    // the answer. Typing it precisely would mean naming all fifteen.
    (...given: unknown[]) =>
      (call as (...args: unknown[]) => Promise<unknown>)(...given).catch(() =>
        refuse(
          'unreachable',
          'We could not reach the server. Nothing you have typed is lost — try again in a moment.',
        ),
      ),
  ])
  return Object.fromEntries(caught) as DataAdapter
}

export function checked(adapter: DataAdapter): DataAdapter {
  const items = against(itemSchema.array(), 'item list')
  const parties = against(partySchema.array(), 'party list')
  const party = against(partySchema, 'party')
  const sundries = against(sundryMasterSchema.array(), 'charge list')
  const sundry = against(sundryMasterSchema, 'charge')
  const invoices = against(invoiceSchema.array(), 'invoice list')
  const invoice = against(invoiceSchema, 'invoice')
  const settings = against(invoiceSettingsSchema, 'settings')
  const insights = against(partyInsightsSchema, 'party insights')
  const credits = against(creditSchema.array(), 'credit list')
  const heldList = against(heldInvoiceSchema.array(), 'list of held invoices')
  const oneHeld = against(heldInvoiceSchema, 'held invoice')
  const attachment = against(attachmentSchema, 'attachment')

  return neverRejects({
    listItems: (search) => adapter.listItems(search).then(items),
    listParties: (search) => adapter.listParties(search).then(parties),
    createParty: (draft) => adapter.createParty(draft).then(party),
    listRecentParties: () => adapter.listRecentParties().then(parties),
    partyInsights: (partyId) => adapter.partyInsights(partyId).then(insights),
    itemsByIds: (ids) => adapter.itemsByIds(ids).then(items),
    partyCredits: (partyId) => adapter.partyCredits(partyId).then(credits),
    holdInvoice: (draft) => adapter.holdInvoice(draft).then(oneHeld),
    listHeld: () => adapter.listHeld().then(heldList),
    resumeHeld: (id) => adapter.resumeHeld(id).then(oneHeld),
    // Nothing comes back but "it is gone", so there is no shape to check — and a check that has
    // nothing to look at is left out out loud rather than written as one that always passes.
    discardHeld: (id) => adapter.discardHeld(id),
    invoiceSettings: () => adapter.invoiceSettings().then(settings),
    listSundries: (search) => adapter.listSundries(search).then(sundries),
    createSundry: (draft) => adapter.createSundry(draft).then(sundry),
    lastUsedSundries: (partyId) => adapter.lastUsedSundries(partyId).then(sundries),
    nextInvoiceNumber: (series) => adapter.nextInvoiceNumber(series).then(against(z.string().min(1), 'invoice number')),
    lastInvoiceDate: () =>
      // Null is a real answer here, not a missing one — a fresh book has no last invoice — so
      // the shape it is checked against has to allow it or the check refuses the truth.
      adapter.lastInvoiceDate().then(against(z.string().min(1).nullable(), 'last invoice date')),
    listInvoices: (query) => adapter.listInvoices(query).then(invoices),
    getInvoice: (id) => adapter.getInvoice(id).then(invoice),
    saveInvoice: (draft) => adapter.saveInvoice(draft).then(invoice),
    attachFile: (name, bytes) => adapter.attachFile(name, bytes).then(attachment),
  })
}
