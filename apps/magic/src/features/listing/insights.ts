// What the AI insight has to say about the invoices currently on screen.
//
// SEPARATE FROM THE BUTTON THAT SHOWS IT, because what is worth saying is arithmetic over a
// list and can be tested without a browser, while the button is a pill with a popover on it.
//
// FOUR, NOT FIVE. The product document lists five and the description of the GSTR-1/2A/2B one
// is copied word for word from the row above it, so nobody has written what that insight says.
// It is left out rather than invented: an insight is a sentence the product asserts to a
// business owner about their own tax filing, and it is the one place on this screen where
// being wrong costs money. Whether the product should assert it at all is a question for the
// people who own the tax rules, not one this file may answer by guessing.
//
// TWO OF THE FOUR SAY THEY CANNOT BE COMPUTED, and they stay on the list saying it. An invoice
// records how much was paid, never when — so payment behaviour and month-on-month trend need a
// field that does not exist. Dropping them would make a strip of two look finished.

import { formatPaise } from '../../lib/money'
import type { Invoice } from '../../data/schema/invoice'
import type { Tab } from './filtering'
import { balanceOf, isCancelled, paymentStateOf } from '../../lib/payment'

export type Insight = {
  id: string
  line: string
  /** True when it is telling you something you might act on, rather than reporting calm or
   * reporting that it cannot see enough. Only these are counted on the button. */
  actionable: boolean
  /** Pressing "Show them" narrows the listing to this tab. */
  showsTab?: Tab
}

/** More than this many times the average for the period is worth a second look. Three, because
 * two catches every large customer and five catches nothing on a normal book. */
const UNUSUAL_MULTIPLE = 3

export function insightsFor(invoices: Invoice[], today: string): Insight[] {
  const live = invoices.filter((invoice) => !isCancelled(invoice))
  const overdue = live.filter((invoice) => paymentStateOf(invoice, today).status === 'overdue')
  const owed = overdue.reduce((sum, invoice) => sum + balanceOf(invoice), 0)
  const parties = new Set(overdue.map((invoice) => invoice.partyName)).size

  const average = live.length === 0 ? 0 : live.reduce((sum, one) => sum + one.totalPaise, 0) / live.length
  const unusual = live.filter((one) => average > 0 && one.totalPaise > average * UNUSUAL_MULTIPLE)

  return [
    overdue.length === 0
      ? { id: 'collect', actionable: false, line: 'Nothing is overdue. Every invoice in this period is inside its due date.' }
      : {
          id: 'collect',
          actionable: true,
          showsTab: 'overdue',
          line: `${formatPaise(owed)} overdue across ${overdue.length} ${overdue.length === 1 ? 'invoice' : 'invoices'} from ${parties} ${parties === 1 ? 'customer' : 'customers'}.`,
        },
    unusual.length === 0
      ? { id: 'unusual', actionable: false, line: 'No invoice in this period is unusually large for this book.' }
      : {
          id: 'unusual',
          actionable: true,
          line: `${unusual.length} ${unusual.length === 1 ? 'invoice is' : 'invoices are'} more than ${UNUSUAL_MULTIPLE} times the average for this period — worth a second look before they go out.`,
        },
    {
      id: 'behaviour',
      actionable: false,
      line: 'Not enough data yet: this needs when each customer paid, and an invoice records only how much.',
    },
    {
      id: 'trend',
      actionable: false,
      line: 'Not enough data yet: comparing this month with the last needs more than one book of history.',
    },
  ]
}
