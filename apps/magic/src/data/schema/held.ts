import { z } from 'zod'

import { invoiceDraftSchema } from './invoice'

// AN INVOICE PUT ASIDE, NOT AN INVOICE SAVED.
//
// A held invoice is a DRAFT and nothing more. It has no number, no date and no due date, because
// those come from the backend when an invoice is actually raised — putting one aside must not
// consume a number from the series, or a counter operator who holds four invoices in an afternoon
// has burned four numbers on documents that may never exist.
//
// WHAT IT ADDS TO THE DRAFT IS AN IDENTITY AND A WHEN, and only so the chooser can say which is
// which. The product document promises these survive logout, closing the application and a power
// failure — a durable-storage promise with no backend behind it, which is filed for stakeholders
// and is answered here the way every other unknown is: the shape is written down, the values are
// invented in `data/mock/`, and the dev team stitches real storage behind the same shape.

export const heldInvoiceSchema = z.object({
  id: z.string().min(1),
  /** When it was put aside, as an ISO instant. The chooser sorts by it, newest first — the one
   * you just put down is the one you are most likely to want back. */
  heldAt: z.string().min(1),
  /** Who it is for, so a row in the chooser is recognisable without opening it. Read off the
   * draft rather than stored twice — it is here because a list of "Held at 14:32" tells nobody
   * anything. */
  partyName: z.string(),
  /** How many lines it has. The other half of what makes a row recognisable. */
  lines: z.number().int().nonnegative(),
  draft: invoiceDraftSchema,
})

export type HeldInvoice = z.infer<typeof heldInvoiceSchema>
