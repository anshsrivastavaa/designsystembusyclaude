// Money, as whole paise. No React, no formatting decisions, no rounding surprises.
//
// Amounts are held as integers of the smallest unit — 1250 is twelve rupees fifty — because
// 0.1 + 0.2 is not 0.3 in a computer, and an invoice that adds two thousand lines will find
// that out. Nothing here ever holds a rupee value as a decimal number.

export type Paise = number

/** 12.5 becomes 1250. Anything unreadable becomes 0 rather than NaN spreading down a column.
 *
 * Number() rather than parseFloat() on purpose: parseFloat reads "12abc" as 12, which turns
 * a typo into a price. Mutation testing found the branch this replaced was unobservable —
 * both halves gave the same answer — which is a branch that cannot be tested and should not
 * have existed. */
export function toPaise(rupees: string | number): Paise {
  const value = Number(rupees)
  if (!Number.isFinite(value)) return 0

  // A CEILING, AND IT IS THE ONE THE INTEGER PROMISE ACTUALLY HAS. Everything here is whole
  // paise held in a JavaScript number, which stops being exact above 2^53 — so "1e30" typed
  // into a price silently produced a figure that no longer added up, and "Infinity" produced
  // a total of Infinity. Number() accepts both. A billion rupees is beyond any invoice this
  // product will see and comfortably inside what the arithmetic can hold.
  const paise = Math.round(value * 100)
  if (Math.abs(paise) > MOST) return 0
  return paise
}

/** A hundred crore, in paise. Past this the integer guarantee stops being true. */
const MOST = 100_00_00_00_000

const GROUPED = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 1250 becomes "12.50", and 123456789 becomes "12,34,567.89".
 *
 * Grouped the Indian way — lakhs and crores, not thousands — because a wholesale invoice
 * total runs to seven figures and an ungrouped one cannot be read at a glance. Always two
 * decimal places, because a column of amounts has to align. */
export function formatPaise(paise: Paise): string {
  const negative = paise < 0
  const absolute = Math.abs(Math.round(paise))
  const body = GROUPED.format(absolute / 100)
  // A genuine negative reads through a minus sign, never through colour. Roughly one man in
  // twelve cannot separate red from green, and a ledger where every negative is red has no
  // alarm colour left for the row that actually needs chasing. Brackets were tried on 20-08
  // and withdrawn; they remain the alternative if the minus sign is ever revisited.
  return negative ? `-${body}` : body
}

/** A party balance, in the words the previous build already used.
 *
 * A payable is a CREDIT balance, not a negative receivable, so it reads "Cr" and carries no
 * sign of its own. This is the v2 convention rather than something invented here, which
 * matters: showing stakeholders a convention they do not use spends the meeting decoding it.
 * Brackets — (1,250.00) — are the alternative if this is ever revisited. */
export function formatBalancePaise(paise: Paise): string {
  // Nothing owed still reads 0.00, not a word and not a bare 0. Every other balance in the
  // column shows two decimals and the column aligns on the point — and the settled row is
  // the one the eye is scanning for, so it is the worst one to break the alignment on.
  if (paise === 0) return GROUPED.format(0)
  return `${GROUPED.format(Math.abs(paise) / 100)} ${paise > 0 ? 'Dr' : 'Cr'}`
}

/** Quantity times price. Both arrive as the user typed them; the answer is whole paise. */
export function lineAmount(quantity: number, pricePaise: Paise): Paise {
  if (!Number.isFinite(quantity)) return 0
  return Math.round(quantity * pricePaise)
}

/** A column of amounts. Integers throughout, so two thousand of them still add up exactly. */
export function sumPaise(amounts: readonly Paise[]): Paise {
  let total = 0
  for (const amount of amounts) total += amount
  return total
}

