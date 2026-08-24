import { z } from 'zod'

import { taxTreatmentSchema } from './item'
import { sundryRowSchema } from './sundry'

/** An e-invoice is registered with the portal, which returns an IRN. It can be cancelled
 * within 24 hours and not after, which is why cancelled is its own state. */
export const eInvoiceStatusSchema = z.enum(['notRequired', 'pending', 'generated', 'cancelled'])

/** An e-way bill covers goods in transit and it EXPIRES — a day per stretch of distance — so
 * a bill that was generated is not necessarily a bill that is still good. */
export const eWayBillStatusSchema = z.enum(['notRequired', 'pending', 'generated', 'expired', 'cancelled'])

// A row is not an item. It carries what the user has typed and what was defaulted for them,
// so the same item may sit on two rows with different quantities — and rows are never merged.
export const invoiceRowSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().nullable(),
  itemName: z.string(),
  quantity: z.number(),
  unit: z.string(),
  pricePaise: z.number().int(),
  // Held rather than derived, because the grid renders two thousand of these and a row that
  // recomputes on every render of its neighbours is the cost the 100ms test measures.
  amountPaise: z.number().int(),
  taxPercent: z.number(),
  /** Carried from the item, because a return groups by it and an invoice is a record of what
   * was sold under which treatment on the day. */
  taxTreatment: taxTreatmentSchema,
  cessPercent: z.number(),
  /** Carried onto the row, because what a thing cost on the day it was sold is a fact about
   * the sale — a later change to the item's cost does not rewrite last month's margin. */
  costPaise: z.number().int(),
  /** A discount on this line. Zero means none, and none shows NOTHING in the column — not even
   * a per-cent sign, which is what made an empty grid look like a grid full of zeroes. */
  discountPercent: z.number(),
  /** Goods given free with this line. They come out of stock and not off the amount, which is
   * why this is a quantity rather than a discount. */
  freeQuantity: z.number(),
})

/** Nothing here says a ROW is locked, and that is the ruling rather than an omission. User
 * rights make a COLUMN read-only for an operator; freezing makes the WHOLE invoice read-only.
 * Neither is per-row, so neither can compete with the cursor row for the row background. A
 * saved invoice always opens in modify with every cell editable, and lines pulled from an
 * order or a challan can be changed once they are on the invoice. */
export const invoiceSchema = z.object({
  id: z.string().min(1),

  // The header. A listing screen reads only these and never opens the rows.
  number: z.string().min(1),
  /** ISO date, no time. An invoice is dated to a day. */
  date: z.string().min(1),
  dueDate: z.string().min(1),

  /** WHAT THE ROWS COME TO BEFORE TAX, AND THE TAX ON THEM — both on the HEADER, because the
   * listing reads the header and never opens the rows.
   *
   * These are here because the listing was reducing over `rows` to get them, which is a second
   * place the same figure is worked out and therefore a second answer the day either changes.
   * The fix was not to guard the second calculation; it was to delete it. A front end draws and
   * checks that what was typed is well-formed — it does not own what an invoice is worth.
   *
   * THE BACKEND SENDS THESE. It already has to compute them to store the invoice, and a listing
   * of two thousand invoices must never fetch two thousand sets of rows to print a column. */
  taxablePaise: z.number().int(),
  taxPaise: z.number().int(),

  partyId: z.string().min(1),
  /** Carried on the invoice as well as on the party. A listing of two thousand invoices
   * cannot fetch two thousand parties to print a name, and the name on an invoice is what it
   * said when it was raised — renaming a party does not rewrite its history. */
  partyName: z.string(),

  totalPaise: z.number().int(),
  /** What has been received against it. Nothing paid, part paid and paid are the same field
   * at three values, so they cannot disagree with each other. */
  paidPaise: z.number().int(),

  /** Set when the invoice was cancelled, null otherwise. A cancelled invoice keeps its number
   * and its total — it is not deleted, and the number is never reused. */
  cancelledAt: z.string().nullable(),

  /** Where this invoice stands with the GST portal. Both are told to the backend BY the
   * portal — no front end can work them out from a total and a date, and guessing would be
   * inventing a claim about somebody's tax compliance. `notRequired` is the commonest answer
   * by far: most invoices are under the e-invoice threshold and most goods do not move far
   * enough to need an e-way bill. It is a state, not an absence, which is why it is a value
   * here rather than a null. */
  eInvoiceStatus: eInvoiceStatusSchema,
  eWayBillStatus: eWayBillStatusSchema,

  rows: z.array(invoiceRowSchema),
})

export type EInvoiceStatus = z.infer<typeof eInvoiceStatusSchema>
export type EWayBillStatus = z.infer<typeof eWayBillStatusSchema>
/** WHAT IS SENT WHEN SAVE IS PRESSED, which is not an Invoice.
 *
 * An invoice has a number, a date and a due date; a draft has none of those, because they come
 * from the backend — the number from the series, the dates from the terms. Sending an Invoice
 * with `id: 'draft'` and three empty strings was a lie the schema itself forbids: those fields
 * are `min(1)`. So a draft is its own shape and says what it does not know.
 *
 * It carries EVERYTHING ON THE SCREEN. It used to send the party and the rows and nothing
 * else, so the charges, the narration and the round-off — all typed by the operator, all
 * visible — were dropped on the floor at the moment of saving. */
export const invoiceDraftSchema = invoiceSchema
  // WHAT THE BACKEND OWNS IS NOT SENT TO IT. The two tax figures sit here with the total for the
  // same reason: they are what the invoice is WORTH, and a draft carries what was typed. The
  // front end working them out on the way to the seam would be the second calculation arriving
  // by another door.
  .omit({
    id: true,
    number: true,
    date: true,
    dueDate: true,
    taxablePaise: true,
    taxPaise: true,
    totalPaise: true,
    paidPaise: true,
    cancelledAt: true,
  })
  .extend({
    sundries: z.array(sundryRowSchema),
    narration: z.string(),
    narrationPrinted: z.boolean(),
    roundOffOn: z.boolean(),
  })

export type InvoiceDraft = z.infer<typeof invoiceDraftSchema>
export type InvoiceRow = z.infer<typeof invoiceRowSchema>
export type Invoice = z.infer<typeof invoiceSchema>

/** A blank row, well-formed and empty. Here rather than with the sample data because it
 * describes the SHAPE of a row with nothing in it, which is true whoever supplies the data. */
export function emptyRow(id: string): InvoiceRow {
  return {
    id,
    itemId: null,
    itemName: '',
    quantity: 0,
    unit: '',
    pricePaise: 0,
    amountPaise: 0,
    taxPercent: 0,
    taxTreatment: 'taxable',
    cessPercent: 0,
    costPaise: 0,
    discountPercent: 0,
    freeQuantity: 0,
  }
}
