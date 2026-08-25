// The one interface between the application and its data. No screen ever calls an API and no
// screen ever reaches into the mock world. Today one file implements this against mock data;
// later a second file implements it against the real backend and nothing else changes.
//
// This is the whole handover story: the dev team implements one interface and the front end
// works.

import type { Attachment } from './schema/attachment'
import type { Invoice, InvoiceDraft } from './schema/invoice'
import type { InvoiceSettings } from './schema/settings'
import type { Item } from './schema/item'
import type { PartyInsights } from './schema/insights'
import type { Credit } from './schema/credit'
import type { HeldInvoice } from './schema/held'
import type { Party } from './schema/party'
import type { Refusal } from './schema/refusal'
import type { SundryMaster } from './schema/sundry'

/** Either the thing, or a refusal saying why not. Every call that can be told no returns one
 * of these, so a screen has to handle the no in order to compile at all. */
export type Answer<Value> = Value | Refusal

/** What a listing is asking for. It grows a field at a time as the listing screen needs one —
 * never a `filters: Record<string, unknown>`, which is a way of not deciding. */
export type InvoiceQuery = { search: string }

/** The four fields a person types. Everything else about a party is answered elsewhere. */
export type PartyDraft = Pick<Party, 'name' | 'mobile' | 'gstin' | 'city'>

export interface DataAdapter {
  listItems(search: string): Promise<Answer<Item[]>>
  listParties(search: string): Promise<Answer<Party[]>>
  /** Whether a party is allowed to exist — the name already taken, the GSTIN real — is
   * theirs to decide, so this can come back refused. */
  /** A party invented at the counter. The screen sends what somebody TYPED and nothing else.
   *
   * WHAT IT MAY NOT SEND: the GSTIN's standing, the trust grade, the credit limit or what is
   * overdue. Those are the backend's answers — the first comes from the GST portal, and a front
   * end that sets it to "active" because the box was not empty has invented a claim about
   * somebody's tax compliance. The interface used to REQUIRE it, so the screen had no choice;
   * now it cannot send it at all. */
  createParty(draft: PartyDraft): Promise<Answer<Party>>
  /** The parties billed most recently, in that order. Shown above the search results. */
  listRecentParties(): Promise<Answer<Party[]>>
  /** Everything known about a party, as counts, plus the finished grade.
   *
   * RAW FACTS AND ONE GRADE, ruled 23-08. The grade arrives with its cap already applied and
   * the capping criterion NAMED, because it has to be one answer for the whole product — the
   * party master, the listing and the reports all want it, and a second surface that works it
   * out works it out differently. The facts arrive as COUNTS and never as sentences: a backend
   * does not send display text, so every word on the panel is written from these. */
  partyInsights(partyId: string): Promise<Answer<PartyInsights>>
  /** The items on an invoice that was OPENED rather than typed, by id.
   *
   * WHAT IT IS FOR, because the shape looks redundant next to `listItems`: the strip under the
   * grid shows the stock, the HSN, the rate and what this customer paid last time. Those are facts
   * about the ITEM MASTER, not about the line, so a row carries none of them — and an invoice that
   * arrives from the backend therefore has a blank strip on every line until somebody re-picks the
   * item, which nobody does. One call for the whole invoice rather than one per line: a fifty-line
   * invoice must not be fifty requests, and a search that happens to match is not an answer to
   * "give me exactly these".
   *
   * Ids that do not exist come back missing rather than as an error. An item deleted from the
   * master after an invoice was raised is ordinary, and the invoice still has to open. */
  itemsByIds(ids: readonly string[]): Promise<Answer<Item[]>>
  /** What this party already has sitting against them — advances, receipts, credit notes and
   * money on account — with what is UNUSED of each.
   *
   * WHAT IS LEFT OF A CREDIT, NEVER WHAT IT WAS WORTH. A receipt half spent against an earlier
   * invoice has half left, and half is the only figure this screen can do anything with. Working
   * it out here would mean the front end reading every invoice the credit has ever touched, which
   * is a ledger's worth of work to answer one number, and a second place the answer is decided.
   *
   * Sorted by date is the ADAPTER's job for the same reason: the settlement panel, the listing
   * and the party master all show this list, and the second one to sort it sorts it differently. */
  partyCredits(partyId: string): Promise<Answer<Credit[]>>
  /** Put the invoice on the screen aside. A DRAFT goes in and a draft comes back out — holding
   * one must not consume a number from the series, or a counter operator who holds four in an
   * afternoon has burned four numbers on documents that may never exist. */
  holdInvoice(draft: InvoiceDraft): Promise<Answer<HeldInvoice>>
  /** Everything put aside, newest first. The order is the adapter's, like every other list. */
  listHeld(): Promise<Answer<HeldInvoice[]>>
  /** Bring one back, and take it out of the held list on the way — a held invoice you have
   * resumed is the invoice on the screen, and a copy left behind is an invoice somebody saves
   * twice. */
  resumeHeld(id: string): Promise<Answer<HeldInvoice>>
  /** Throw one away without opening it. */
  discardHeld(id: string): Promise<Answer<null>>
  /** How this company bills — tax mode, rounding, its own state code. Read once when the
   * screen opens. Not a per-invoice choice, which is why nothing writes it back. */
  invoiceSettings(): Promise<Answer<InvoiceSettings>>
  /** The sundry master. A charge is picked from this list, never typed as free text, or the
   * same freight arrives under four spellings and no report can group it. */
  listSundries(search: string): Promise<Answer<SundryMaster[]>>
  /** A charge invented on the spot. The operator picks how it is worked out once, here, and
   * it is written back to the master — so it behaves the same on the next invoice. */
  createSundry(draft: Omit<SundryMaster, 'id'>): Promise<Answer<SundryMaster>>
  /** The sundries this party had last time, in the order they were charged. Users add the
   * same charges to the same party repeatedly, so the picker offers these first. */
  lastUsedSundries(partyId: string): Promise<Answer<SundryMaster[]>>
  /** The number this series would give the next invoice, and the day it is dated.
   *
   * THE NUMBER IS NOT THE FRONT END'S TO WORK OUT. It comes from the series, the books and
   * the financial year, and two people creating an invoice at the same moment must not both
   * be shown 4/2026-27. What is on the screen before saving is what this says, and it is a
   * PREVIEW — the number the invoice actually keeps is the one `saveInvoice` returns.
   *
   * Chosen, not ruled (21-08): the screen has to show a number, and inventing one here would
   * be a front end making a claim about the books. */
  nextInvoiceNumber(series: string): Promise<Answer<string>>
  /** The date on the last invoice raised, or null in a book with none yet.
   *
   * ASKED FOR RATHER THAN WORKED OUT. The date field offers it as a quick pick for a day of
   * back-dated entry, and the front end could only answer it by fetching invoices and sorting
   * them — which is a listing's worth of work to read one field, and a second place the answer
   * is decided. Null is a real answer: the first invoice in a fresh book has no last date, and
   * the pick is not offered rather than landing on today and claiming to be something else. */
  lastInvoiceDate(): Promise<Answer<string | null>>
  /** The header of every invoice that matches. A listing never opens the rows. */
  listInvoices(query: InvoiceQuery): Promise<Answer<Invoice[]>>
  getInvoice(id: string): Promise<Answer<Invoice>>
  /** The backend is authoritative here. What the screen worked out on the way is for the
   * person typing; what comes back from this is what is true. */
  /** Take a file the person has chosen and give back the record of it.
   *
   * WHETHER THE FILE IS ALLOWED IS DECIDED BEFORE THIS IS CALLED, in `lib/attachments.ts` — the
   * extension and the byte count are the front end's to check, and the refusal has to arrive in
   * the same instant as the file rather than after a round trip. What comes back from here is
   * the half a browser cannot know: an id, WHO is signed in, and WHEN by a clock that is not
   * the operator's laptop.
   *
   * The bytes are not sent yet. The screen keeps them and hands them over at save. */
  attachFile(name: string, bytes: number): Promise<Answer<Attachment>>

  saveInvoice(draft: InvoiceDraft): Promise<Answer<Invoice>>
}
