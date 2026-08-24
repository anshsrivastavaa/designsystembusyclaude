// Every answer from the adapter, checked against the schema that describes it.
//
// WHY A WRAPPER AND NOT A CALL IN EACH SCREEN. There is one seam, and this is it. A check
// written into each screen is a check somebody forgets in the fourteenth screen; a check on
// the seam covers every call that will ever be made, including the ones nobody has written.
//
// A FAILURE IS A REFUSAL, NOT A THROW. The screens already handle a refusal — they have to, to
// compile — so bad data arrives as a sentence somebody can read rather than as a blank screen
// and a console message nobody sees. What it says is deliberately about US: the operator did
// nothing wrong and cannot fix it, so it tells them to report it rather than to try again.

import { z } from 'zod'

import type { DataAdapter, Answer } from './adapter'
import { invoiceSchema } from './schema/invoice'
import { itemSchema } from './schema/item'
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

  return {
    listItems: (search) => adapter.listItems(search).then(items),
    listParties: (search) => adapter.listParties(search).then(parties),
    createParty: (draft) => adapter.createParty(draft).then(party),
    listRecentParties: () => adapter.listRecentParties().then(parties),
    partyInsights: (partyId) => adapter.partyInsights(partyId).then(insights),
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
  }
}
