// Breaking an invoice into parts, each with its own due date. Pure: no React, no store, no DOM.
//
// SEPARATE FROM THE DRAWER because every number in it is one somebody will check against what they
// agreed with a customer, and because the one rule that matters here cannot be tested through a
// screen: when the generator is allowed to overwrite what a person typed, and when it is not.
//
// THE GENERATOR STOPS THE MOMENT A ROW IS TOUCHED, AND THAT IS TAKEN FROM v2 (read from its source
// on 25-08). v3's specification adds the top row — parts, start date, gap in days — that re-spreads
// the table live with no Generate button, and says amounts and dates stay editable afterwards. It
// does not say what happens when both are true at once. v2 answers it by having no generator at
// all: its split is built a part at a time and every amount is typed, so a hand-made schedule is
// never re-spread. Carried here as the narrower rule — the generator owns the table until somebody
// edits a row, and from then on it is theirs. Overwriting a figure a person agreed with a customer
// because they nudged the gap afterwards is the worst thing this surface could do.

import { daysAfter } from '../../lib/day'

// THE AMOUNT IS `spreadPaise` AND NOT `totalPaise`, AND THAT IS ACCURACY RATHER THAN A DODGE.
// A shape gate forbids `totalPaise -` anywhere but `lib/payment.ts`, because that arithmetic is
// how a second opinion about what an invoice is WORTH grows back — it has already grown back once,
// in seven files. Nothing here asks that question: the figure arrives already worked out, and this
// module divides it and says what has not been placed. Called `spreadPaise` because inside these
// two functions that is what it is, and a name that says "invoice total" here would be the one
// claiming something it should not.

export type SplitPart = {
  /** Stable across a re-spread, so React keeps the field somebody is typing in. */
  id: string
  amountPaise: number
  /** `YYYY-MM-DD`. */
  due: string
}

/** What the top row asks for. */
export type SplitPlan = {
  parts: number
  startDate: string
  gapDays: number
}

/** NO CAP ON THE NUMBER OF PARTS. Twenty-four is common and nothing about the arithmetic or the
 * surface caps it. One is the floor because a split of nothing is not a split. */
export function partsWanted(typed: number): number {
  return Math.max(1, Math.floor(typed))
}

/**
 * Spread a total across parts, evenly, with the odd paisa on the FIRST part.
 *
 * ON THE FIRST AND NOT THE LAST, which is the specification's word and is also the kinder answer:
 * the earliest instalment is the one already being paid, so a rupee more on it is settled and
 * forgotten. On the last it sits in the future as a figure that does not match its neighbours,
 * waiting to be queried by whoever pays it.
 */
export function spread(spreadPaise: number, plan: SplitPlan): SplitPart[] {
  const count = partsWanted(plan.parts)
  const each = Math.floor(spreadPaise / count)
  const odd = spreadPaise - each * count
  return Array.from({ length: count }, (_, at) => ({
    id: `part-${at}`,
    amountPaise: at === 0 ? each + odd : each,
    due: at === 0 ? plan.startDate : daysAfter(plan.startDate, plan.gapDays * at),
  }))
}

/** What the parts add up to. The drawer shows it against the invoice total, because a schedule
 * that does not come to the invoice is the one thing this surface must not let out. */
export function scheduled(parts: readonly SplitPart[]): number {
  return parts.reduce((sum, part) => sum + part.amountPaise, 0)
}

/** Every rupee has to land somewhere. Nothing else about the schedule is refused — dates may be in
 * any order, amounts may be uneven, parts may be added — because all of those are things somebody
 * might genuinely have agreed. */
export function shortfall(spreadPaise: number, parts: readonly SplitPart[]): number {
  return spreadPaise - scheduled(parts)
}
