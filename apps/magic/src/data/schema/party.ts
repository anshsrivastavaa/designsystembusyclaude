import { z } from 'zod'

/** THREE GRADES, NOT FIVE. Ruled 23-08: A is 80 to 100, B is 60 to 79, C is below 60, and the
 * number is never shown. Five letters were a ladder people read as a score with extra steps,
 * and the panel behind the badge is where the reasons live. */
export const trustGradeSchema = z.enum(['A', 'B', 'C'])
/** `unchecked` is a real answer and the commonest one for a party created at the counter: the
 * portal has not been asked yet. It is not `active` — claiming a registration is good because
 * somebody typed fifteen characters is a claim about tax compliance nobody made. */
export const gstinStatusSchema = z.enum(['active', 'suspended', 'cancelled', 'inactive', 'unchecked', 'none'])

export const partySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // Searched. These are the three things somebody actually types to find a customer.
  mobile: z.string(),
  gstin: z.string(),
  // Shown but NOT searched. Nobody types a city to find a customer — it is how you tell two
  // Sharmas apart once they are both in front of you.
  city: z.string(),
  // Positive is a receivable, what they owe us, and reads Dr. Negative is a payable, what we
  // owe them, and reads Cr — a credit balance, not a negative receivable, so it carries no
  // sign. This is the convention the previous build used, and brackets — (1,250.00) — are the
  // alternative if it is ever revisited.
  outstandingPaise: z.number().int(),

  /** How this party has behaved, with the cap already applied. Null when there is not enough
   * history to say, which the screen draws as a dash — NOT as nothing. The document says show
   * nothing; nothing means no badge, no badge means no door, and a brand-new party would then
   * have no way to reach their GSTIN status at all. Filed for stakeholders.
   *
   * THE BACKEND GRADES, AND IT IS THE ONLY THING THAT DOES. The party master, the listing and
   * the reports all want this answer, and the second surface that computes it computes it
   * differently. `partyInsights` carries the same letter with the facts behind it. */
  trustGrade: trustGradeSchema.nullable(),
  /** What they are allowed to owe, in paise. Zero means no limit has been set, which is not
   * the same as a limit of nothing. */
  creditLimitPaise: z.number().int(),
  /** How many days this party is given to pay, from the invoice date. Zero means no terms have
   * been agreed, which is not the same as due immediately.
   *
   * IT LIVES ON THE PARTY MASTER AND THE BACKEND SUPPLIES IT. The due-date picker offers "Party
   * credit days" as its first pick, and a front end that worked that number out — or guessed a
   * house default — would be inventing a term of trade nobody agreed. It is a fact about the
   * customer, so it is read, never derived. */
  creditDays: z.number().int(),
  /** Of the outstanding, how much is past its due date. */
  overduePaise: z.number().int(),
  /** The GST registration's standing. `none` is an unregistered buyer — ordinary, not a
   * problem. `suspended`, `cancelled` and `inactive` are, because you cannot claim input tax
   * against a registration that is not currently standing. */
  gstinStatus: gstinStatusSchema,
})

/**
 * The registrations you cannot claim input tax against.
 *
 * ONE DEFINITION, THREE CONSUMERS: the grade is held at C for these, the panel says which
 * criterion held it, and the badge wears the mark for them. Three copies of "which statuses are
 * dead" is the sort of thing that stays right until one of them learns about `suspended` and the
 * others do not — which is exactly what happened: `suspended` was named in two comments and in
 * the product document for weeks while the enum could not represent it at all.
 */
export function gstinIsDead(status: GstinStatus): boolean {
  return status === 'suspended' || status === 'cancelled' || status === 'inactive'
}

export type TrustGrade = z.infer<typeof trustGradeSchema>
export type GstinStatus = z.infer<typeof gstinStatusSchema>
export type Party = z.infer<typeof partySchema>
