// How this invoice is being settled: which credits are going against it, and what is being paid
// now.
//
// IN THE STORE AND NOT IN THE PANEL, because the panel is a popover and a popover unmounts. A
// person who ticks two credits, closes the panel to check a line, and opens it again has not
// changed their mind — and local state would have thrown their answer away between the two.
//
// TENDERED IS HERE AND IS NEVER SAVED, which is the one thing about this slice worth knowing.
// What a customer handed over is how the change was worked out at the counter; it is not a fact
// about the invoice, and `saveInvoice` has no field for it. It lives here only so the figure
// survives the panel closing.

import type { Credit } from '../../data/schema/credit'
import { withAmount, withCredit, type Adjustments } from './settlementSums'

export type PaymentMode = 'cash' | 'bank' | 'upi'

export type Settling = {
  /** How much of each credit is going against this invoice, by credit id. A credit not in here
   * is not ticked — one representation, so the tick and the amount cannot disagree. */
  adjustments: Adjustments
  /** Money being taken now, over the counter or into the bank. */
  payingPaise: number
  paymentMode: PaymentMode
  /** What the customer handed over. Display only: the change is worked out from it and neither
   * figure is ever sent. */
  tenderedPaise: number
  toggleCredit: (credit: Credit, on: boolean, owedPaise: number) => void
  setAdjustment: (credit: Credit, paise: number, owedPaise: number) => void
  setPaying: (paise: number) => void
  setPaymentMode: (mode: PaymentMode) => void
  setTendered: (paise: number) => void
}

type State = Pick<Settling, 'adjustments' | 'payingPaise' | 'paymentMode' | 'tenderedPaise'>
type Apply = (change: Partial<State> | ((state: State) => Partial<State>)) => void

export function settling(set: Apply): Settling {
  return {
    adjustments: {},
    payingPaise: 0,
    // BANK IS NOT THE DEFAULT AND NEITHER IS CASH. Cash is, because the counter is where this
    // panel is used and the tendered field only exists for it — starting anywhere else means the
    // commonest journey opens with a mode change in front of it.
    paymentMode: 'cash',
    tenderedPaise: 0,
    toggleCredit: (credit, on, owedPaise) =>
      set((state) => ({ adjustments: withCredit(state.adjustments, credit, on, owedPaise) })),
    setAdjustment: (credit, paise, owedPaise) =>
      set((state) => ({ adjustments: withAmount(state.adjustments, credit, paise, owedPaise) })),
    setPaying: (payingPaise) => set({ payingPaise: Math.max(0, payingPaise) }),
    // Changing away from cash leaves the tendered figure where it was rather than clearing it:
    // a mode picked by mistake and picked back should not have cost anybody what they typed.
    setPaymentMode: (paymentMode) => set({ paymentMode }),
    setTendered: (tenderedPaise) => set({ tenderedPaise: Math.max(0, tenderedPaise) }),
  }
}
