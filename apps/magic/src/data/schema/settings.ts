import { z } from 'zod'

// How this company bills. These are settings, not choices made per invoice: an operator does
// not pick a tax mode on a Tuesday. They arrive through the adapter like everything else,
// because every unknown is a field on the data rather than a branch in the code.

/** Where tax is decided, and it is one of three places — never two at once.
 *
 *   itemExclusive — a rate per line, added on. Tax columns sit BEFORE Amount.
 *   itemInclusive — a rate per line, already inside the price. Tax columns sit AFTER Amount.
 *   billWise      — no tax columns at all. Tax is applied through bill sundry.
 */
export const taxModeSchema = z.enum(['itemExclusive', 'itemInclusive', 'billWise'])

export const invoiceSettingsSchema = z.object({
  taxMode: taxModeSchema,
  roundOff: z.object({
    stepPaise: z.number().int(),
    method: z.enum(['up', 'down', 'nearest']),
    /** The operator's switch on the round off line. The step and the method above are the
     * company's; whether this invoice rounds at all is theirs. */
    on: z.boolean(),
  }),
  /** Round each line, then add. Off by default, and when it is on the totals use the
   * already-rounded row values — they are never worked out again from the unrounded ones, or
   * the invoice would disagree with the column the operator is reading. */
  roundEachLine: z.boolean(),
  /** Group the tax summary by HSN code as well as by rate. A setting, not the default. */
  hsnWiseSummary: z.boolean(),
  /** The first two digits of the company's own GSTIN. Place of supply is decided against
   * this, never by a setting that says "charge IGST". */
  companyStateCode: z.string().length(2),
  /** Which optional item columns this company shows. Every one of them is a column the product
   * document names and the settings drawer offers; they are off by default because the default
   * set is the six that every invoice needs. */
  columns: z.object({
    discount: z.boolean(),
    alias: z.boolean(),
    hsn: z.boolean(),
    mrp: z.boolean(),
    freeQuantity: z.boolean(),
  }),
})

export type TaxMode = z.infer<typeof taxModeSchema>
export type InvoiceSettings = z.infer<typeof invoiceSettingsSchema>
