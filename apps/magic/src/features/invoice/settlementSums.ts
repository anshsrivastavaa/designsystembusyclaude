// The arithmetic behind the settlement panel. Pure: no React, no store, no DOM.
//
// NAMED `settlementSums` AND NOT `settlement` because `Settlement.tsx` is the panel, and two
// files whose names differ only in their first letter's case are ONE file on a Mac and two on a
// Linux runner — which is a build that is green here and red in CI, or the reverse.
//
// SEPARATE FROM THE PANEL because it is the part that has to be RIGHT rather than the part that
// has to look right, and because every one of these answers is a number somebody will check
// against their own ledger. A clamp written inside a change handler is a clamp nobody can test.
//
// THE FRONT END MAY INVENT THE CREDITS AND MAY NOT INVENT A SECOND WAY TO WORK THEM OUT. What is
// here is arithmetic over figures the adapter supplied — never a rule about what a credit is
// worth, which is the ledger's answer and arrives on the credit itself.

import type { Credit } from '../../data/schema/credit'

/** How much of each credit is being put against this invoice, by credit id. A credit that is not
 * in here is not ticked, which is the same thing as adjusting nothing — one representation, so
 * there is no way for the tick and the amount to disagree. */
export type Adjustments = Readonly<Record<string, number>>

/** WHAT A CREDIT MAY BE ADJUSTED BY, and both ceilings are real.
 *
 * It cannot give more than it has left, and it cannot pay more than is still owed after
 * everything else already ticked. Without the second, ticking four credits on a small invoice
 * hands back a negative balance and an "adjusted total" the customer is owed — which is a claim
 * about money that has to come from the ledger, not from a panel doing subtraction. */
export function adjustmentCeiling(
  credit: Credit,
  adjustments: Adjustments,
  owedPaise: number,
): number {
  const others = Object.entries(adjustments)
    .filter(([id]) => id !== credit.id)
    .reduce((sum, [, amount]) => sum + amount, 0)
  return Math.max(0, Math.min(credit.availablePaise, owedPaise - others))
}

/** Tick a credit on or off. Ticking it offers everything it can give, which is what a person
 * ticking it meant — the alternative is a tick that adds a row of zero and waits to be typed
 * into twice. */
export function withCredit(
  adjustments: Adjustments,
  credit: Credit,
  on: boolean,
  owedPaise: number,
): Adjustments {
  if (!on) {
    const rest = { ...adjustments }
    delete rest[credit.id]
    return rest
  }
  return { ...adjustments, [credit.id]: adjustmentCeiling(credit, adjustments, owedPaise) }
}

/** Type a different amount against a ticked credit, held inside both ceilings. */
export function withAmount(
  adjustments: Adjustments,
  credit: Credit,
  paise: number,
  owedPaise: number,
): Adjustments {
  const held = Math.max(0, Math.min(paise, adjustmentCeiling(credit, adjustments, owedPaise)))
  return { ...adjustments, [credit.id]: held }
}

export type Settlement = {
  /** What the invoice comes to. The panel's first section, and the only figure in it. */
  owedPaise: number
  /** Everything ticked, added up. */
  adjustedPaise: number
  /** Money being taken now, in whatever mode. */
  payingPaise: number
  /** What is still to collect once both are off it. Never below zero — an invoice cannot be
   * over-collected here, and a panel that says it can is a panel inventing a refund. */
  balancePaise: number
  /** Handed back more cash than the bill. Zero for every other mode, and zero when nothing was
   * tendered — which is not the same as a change of nothing, so the panel asks this rather than
   * comparing two figures itself. */
  changePaise: number
}

export function settle({
  owedPaise,
  adjustments,
  payingPaise,
  tenderedPaise,
  mode,
}: {
  owedPaise: number
  adjustments: Adjustments
  payingPaise: number
  tenderedPaise: number
  mode: 'cash' | 'bank' | 'upi'
}): Settlement {
  const adjustedPaise = Object.values(adjustments).reduce((sum, amount) => sum + amount, 0)
  const balancePaise = Math.max(0, owedPaise - adjustedPaise - payingPaise)
  // CHANGE IS A CASH IDEA AND NOTHING ELSE. Nobody hands back three rupees on a bank transfer,
  // so the figure is not shown rather than shown as zero — a zero in a field says "this applies
  // and the answer is none".
  const changePaise = mode === 'cash' ? Math.max(0, tenderedPaise - payingPaise) : 0
  return { owedPaise, adjustedPaise, payingPaise, balancePaise, changePaise }
}
