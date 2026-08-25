// What runs once the invoice is saved, and in what order.
//
// PURE, SO THE ORDER CAN BE TESTED WITHOUT A SCREEN. The order is ruled — e-invoice, e-way,
// print, email, WhatsApp, then a new invoice — and an order written inside a click handler is an
// order nobody can check.
//
// A FAILURE LEAVES THE INVOICE SAVED AND DOES NOT REPEAT THE POSTING. That is the whole reason
// this is a list of steps rather than one long `await` chain: the save has already happened by the
// time any of this runs, so a step that fails must stop the chain, name itself, and never send the
// invoice again. An operator who sees "could not print" and presses Save a second time must not
// end up with two invoices.

export type TailStep = 'eInvoice' | 'eWay' | 'print' | 'email' | 'whatsapp'

/** Where the screen goes once the tail has run. Two tiers, and they are the whole of the choice —
 * the icons beside them are switches and not a menu, so Save never means a different thing
 * depending on which row was picked last. */
export type Landing = 'new' | 'listing'

/** The three the operator switches on the tail: a copy of the document, sent three ways. */
export type SenderSwitches = { print: boolean; email: boolean; whatsapp: boolean }

/** Everything the tail runs, which is the three above plus the two compliance postings. The two
 * are not drawn beside the others — they are a different question and have their own pair on the
 * bar — but they are part of the same ordered chain. */
export type TailSwitches = SenderSwitches & {
  eInvoice: boolean
  eWay: boolean
}

/** THE ORDER IS RULED AND IT IS NOT TASTE. The two portal postings go first, because everything
 * after them is a copy of a document whose compliance status they decide — printing an invoice and
 * then discovering the e-invoice was refused hands the customer a piece of paper that is wrong. */
const ORDER: readonly TailStep[] = ['eInvoice', 'eWay', 'print', 'email', 'whatsapp']

/** The steps left on, in the order they run. */
export function tailFor(switches: TailSwitches): readonly TailStep[] {
  return ORDER.filter((step) => switches[step])
}

/** What each step is called when it has to be named in a failure. Here rather than at the call
 * site, so the words cannot part from the list they describe. */
const TAIL_SAYS: Record<TailStep, string> = {
  eInvoice: 'the e-invoice',
  eWay: 'the e-way bill',
  print: 'printing',
  email: 'the email',
  whatsapp: 'the WhatsApp message',
}

export type TailResult = { done: readonly TailStep[]; failedAt: TailStep | null; message: string | null }

/**
 * Run the tail. `attempt` does one step and says whether it worked.
 *
 * STOPS AT THE FIRST FAILURE. The steps are ordered because the later ones depend on the earlier
 * ones being true; carrying on past a refused e-invoice would email a document that is not valid.
 * The invoice stays saved either way, which is what the message has to say — otherwise an operator
 * reads "could not print" as "not saved" and presses Save again.
 */
export async function runTail(
  steps: readonly TailStep[],
  attempt: (step: TailStep) => Promise<boolean>,
): Promise<TailResult> {
  const done: TailStep[] = []
  for (const step of steps) {
    const worked = await attempt(step)
    if (!worked) {
      return {
        done,
        failedAt: step,
        message: `Saved. ${TAIL_SAYS[step]} did not go through — the invoice is safe, so do not save it again.`,
      }
    }
    done.push(step)
  }
  return { done, failedAt: null, message: null }
}
