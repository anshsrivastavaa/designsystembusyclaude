// What state an invoice is in, and what is still owed on it.
//
// ONE FUNCTION, AND IT LIVES HERE. There were two. This file's own comment already claimed it
// existed "so the listing screen and this one cannot answer the question differently", and it
// was imported by its own test and nothing else, while seven listing files used a second copy
// in features/listing/status.ts. They disagreed on three things, and region four is when the
// invoice starts asking the same question — so the disagreement had to be settled before two
// screens could answer it out loud.
//
// WHICH VOCABULARY SURVIVED, AND WHY. The listing's five words did: cancelled, paid, overdue,
// on account, pending. They are the product's own accounting language, they are on the chips
// and the tabs, and they were argued into place over several rounds. The other set — unpaid,
// partly, paid — was plainer English that had never reached a screen. Re-deciding a settled
// vocabulary spends Aj's time twice on the same question.
//
// OVERDUE IS A STATE, NOT A FLAG, and the fact that rides beside it is PART PAID. The five
// words are a ranking of urgency — late outranks part paid, because "Overdue" is the word that
// gets an invoice chased — so a part-paid late invoice is still CALLED overdue, exactly as the
// listing has always called it. What the single word loses is that money is already against it,
// and that is what `partPaid` carries.
//
// This was first written the other way round, with `overdue` as the flag. It could never differ
// from `status === 'overdue'`: a second way to ask one question, which is the whole fault being
// removed here, rebuilt inside the fix.
//
// THE BALANCE IS NEVER NEGATIVE. It is what is still owed, so it stops at zero. An overpayment
// is not a smaller debt; it is a credit to the PARTY, and it belongs on the party's account
// rather than hidden inside one invoice as a negative — which is exactly how the party drawer
// already reads a payable. The mock carries no overpaid invoice today, so nothing here invents
// a field for one; the day receipts arrive, the credit is theirs to model.
//
// NOTHING HERE INVENTS A RULE THE BACKEND OWNS. Whether an invoice is overdue is arithmetic on
// two dates and two amounts, all four of which are on the invoice. Whether it is ALLOWED to be
// anything is not our decision and is not here.
//
// HOLD IS MISSING AND THAT IS NOT AN OVERSIGHT. The reference build has a Hold tab, gated on a
// company setting, but the invoice header carries no field that could put an invoice on hold.
// Deriving one would be inventing a business rule.

/** Cancelled first, then settled, then late, then part paid, then waiting. The order matters:
 * an invoice can be several of these at once, and this is which one it is CALLED. */
export type InvoiceStatus = 'cancelled' | 'paid' | 'overdue' | 'onAccount' | 'pending'

/** Everything the question needs, and nothing else. Structural rather than the Invoice type, so
 * this file stays pure of the data layer and anything invoice-shaped can be asked. */
export type Payable = {
  totalPaise: number
  paidPaise: number
  dueDate: string
  cancelledAt: string | null
}

export type PaymentState = {
  /** The one word it is called: what the chip says and which tab it falls under. */
  status: InvoiceStatus
  /** Still owed. Never negative, and zero on a cancelled invoice — it keeps its total for the
   * record, but nobody is going to collect it. */
  balancePaise: number
  /** Some money is against it and it is not settled. True alongside 'overdue' as often as
   * alongside 'onAccount', which is the whole reason it exists: the word says which is more
   * urgent, and this says what has already been received. */
  partPaid: boolean
}

/** Cancelled is a payment state, so asking about it goes through here rather than through six
 * separate reads of the same field. */
export const isCancelled = (invoice: Payable): boolean => invoice.cancelledAt !== null

/** What is still owed. Its own function because it is asked without a date — a column of
 * receivables does not care what day it is — and because paymentStateOf uses the same one. */
export function balanceOf(invoice: Payable): number {
  if (isCancelled(invoice)) return 0
  return Math.max(0, invoice.totalPaise - invoice.paidPaise)
}

/** `today` is passed in rather than read, because a function that reads the clock cannot be
 * tested on the day the bug happens. */
export function paymentStateOf(invoice: Payable, today: string): PaymentState {
  const balancePaise = balanceOf(invoice)

  if (isCancelled(invoice)) return { status: 'cancelled', balancePaise, partPaid: false }

  // Settled beats late. A bill paid three months after it was due is paid, not overdue — the
  // mock carries exactly that invoice, because the naive check calls it overdue.
  const settled = invoice.paidPaise >= invoice.totalPaise
  const partPaid = !settled && invoice.paidPaise > 0

  if (settled) return { status: 'paid', balancePaise, partPaid: false }
  // ISO dates compare correctly as strings, which is most of why the schema holds them as ISO.
  // Due ON today is not yet late; you have until the end of the day.
  if (invoice.dueDate < today) return { status: 'overdue', balancePaise, partPaid }
  if (partPaid) return { status: 'onAccount', balancePaise, partPaid }
  return { status: 'pending', balancePaise, partPaid }
}

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  cancelled: 'Cancelled',
  paid: 'Paid',
  overdue: 'Overdue',
  onAccount: 'On Acc',
  pending: 'Pending',
}

/** Which tone the Chip wears.
 *
 * THE WORD ALONE FOR FOUR OF THE FIVE. Paid, Pending, On Acc and Cancelled are all normal
 * states of a normal invoice, and a listing where every row is tinted has no tint left for the
 * row that actually needs chasing. Only Overdue is an exception, and even there the word does
 * the work — take the colour away and the listing still reads exactly the same. */
export const STATUS_TONE = {
  cancelled: 'neutral',
  paid: 'neutral',
  overdue: 'danger',
  onAccount: 'neutral',
  pending: 'neutral',
} as const
