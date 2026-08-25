import { z } from 'zod'

// What a party already has sitting against them, before this invoice is settled.
//
// FOUR TYPES AND THEY ARE ONE LIST, ruled 24-08. Advance, Receipt, Credit Note and On Account
// arrive together, sorted by date, weighted equally — not four sections and not four tabs. They
// are four reasons the same thing is true, which is that money is available; splitting them up
// makes the operator decide which pile to look in before they know what is in any of them.
//
// THE FRONT END MAY INVENT THESE NUMBERS AND MAY NOT INVENT A SECOND WAY TO WORK THEM OUT. Every
// figure below comes out of `data/mock/` today and out of the ledger later, through this same
// shape. What is NOT here is anything derived: how much of a credit is left after this invoice
// takes some is arithmetic the screen does, and arithmetic the screen does is never stored.

export const creditTypeSchema = z.enum(['advance', 'receipt', 'creditNote', 'onAccount'])
export type CreditType = z.infer<typeof creditTypeSchema>

export const creditSchema = z.object({
  id: z.string().min(1),
  type: creditTypeSchema,
  /** The document this credit came from — a receipt number, a credit-note number.
   *
   * EMPTY IS A REAL ANSWER AND IT BELONGS TO `onAccount`. Money on account is money that arrived
   * without a document naming what it was for; that is the whole of what "on account" means. The
   * panel draws a dash for it rather than a blank, because a blank reads as a field nobody
   * filled in and a dash reads as an answer. */
  reference: z.string(),
  /** The day it arrived, as `YYYY-MM-DD`. The list is sorted by this. */
  date: z.string().min(1),
  /** What is still unused of it, in paise. Never what it was originally worth: a receipt half
   * spent against an earlier invoice has half left, and half is the only number this screen can
   * do anything with. */
  availablePaise: z.number().int().nonnegative(),
})

export type Credit = z.infer<typeof creditSchema>

/** What each type is called on the screen. Here rather than in the panel, because the listing
 * and the party master will both want the same four words and the second place they are written
 * is the place that says "Credit note" while the first says "Credit Note". */
export const CREDIT_TYPE_LABEL: Record<CreditType, string> = {
  advance: 'Advance',
  receipt: 'Receipt',
  creditNote: 'Credit Note',
  onAccount: 'On Account',
}
