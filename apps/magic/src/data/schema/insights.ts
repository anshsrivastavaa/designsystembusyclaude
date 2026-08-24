import { z } from 'zod'

import { gstinStatusSchema, trustGradeSchema } from './party'

// WHAT IS KNOWN ABOUT A PARTY, as facts and one finished grade.
//
// RAW COUNTS AND A FINISHED GRADE, ruled 23-08, and the split is the whole point:
//
//   • THE GRADE IS THE BACKEND'S, cap already applied and the capping criterion NAMED. It has
//     to be one answer for the whole product — the party master, the listing and every report
//     will want it, and the second surface that computes it computes it differently.
//   • THE FACTS ARE COUNTS, never sentences. A backend does not send display text: it sends
//     eighteen bills and two late, and the screen writes the words. Sentences from a server
//     cannot be translated, cannot be re-worded when the design changes, and arrive already
//     deciding what the screen is allowed to say.
//
// So there is NO SCORING ARITHMETIC ON THE SCREEN and no wording in the answer.

export const partyTransactionSchema = z.object({
  id: z.string().min(1),
  /** ISO. */
  date: z.string().min(1),
  /** The document, as a person refers to it: "Invoice 4/2026-27". */
  voucher: z.string().min(1),
  amountPaise: z.number().int(),
  status: z.enum(['paid', 'partly', 'unpaid', 'overdue', 'cancelled']),
})

export const partyInsightsSchema = z.object({
  partyId: z.string().min(1),
  /** The letter, with the cap applied. Null when there is not enough history to grade. */
  grade: trustGradeSchema.nullable(),
  /** WHICH CRITERION HELD THE GRADE DOWN, named rather than implied. Null when nothing did.
   * Without the name the panel would have to work out why a good party is a C, which is the
   * arithmetic this shape exists to keep off the screen. */
  cappedBy: z.enum(['gstin']).nullable(),

  // Payment record.
  billsTotal: z.number().int(),
  billsPaid: z.number().int(),
  billsLate: z.number().int(),
  /** Null when they have never paid anything. */
  averageDaysToPay: z.number().nullable(),
  lastPaidDaysAgo: z.number().nullable(),

  // Overdue.
  overdueBills: z.number().int(),
  /** The age of the OLDEST overdue bill, in days. Zero when none is overdue. */
  oldestOverdueDays: z.number().int(),
  overduePaise: z.number().int(),

  // The ledger.
  outstandingPaise: z.number().int(),
  creditLimitPaise: z.number().int(),

  // History.
  /** ISO, or empty when they have never been billed. */
  firstBillDate: z.string(),

  // GST.
  gstinStatus: gstinStatusSchema,
  /** ISO, or empty. Only ever set when the status is cancelled. */
  gstinCancelledOn: z.string(),
  /** The period returns are filed up to — "July 2026" — or empty when unknown. */
  filedTo: z.string(),

  /** The last five, newest first. Fewer when there are fewer. */
  transactions: partyTransactionSchema.array(),
})

export type PartyTransaction = z.infer<typeof partyTransactionSchema>
export type PartyInsights = z.infer<typeof partyInsightsSchema>
