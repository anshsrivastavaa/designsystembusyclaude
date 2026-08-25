// WHAT A NUMERAL CELL WILL ACCEPT, AND WHAT `5k` MEANS.
//
// THE BUG THIS FIXES WAS SILENT, WHICH IS THE WORST KIND. `5k` typed into Price reached
// `toPaise`, where `Number('5k')` is NaN, and the guard there — right for its own job — turned
// NaN into zero. So somebody typing the shorthand the product is meant to support got an invoice
// line worth nothing, with no message, no red cell and nothing to notice. A guard that turns a
// misunderstanding into a plausible number is worse than a crash.
//
// SO THERE ARE TWO HALVES HERE AND THEY ARE NOT THE SAME JOB. One says what a cell will let you
// TYPE, refusing the rest keystroke by keystroke. The other says what the text you finished
// typing MEANS. Written as one function they collapse into "parse it and see", which is exactly
// how the fault got in: the cell accepted `5k`, showed `5k`, and stored zero.
//
// IT LIVES BESIDE THE GRID, NOT IN lib/money.ts, AND THAT IS DELIBERATE. `toPaise` is the general
// converter — the listing's amount filter and the mock data both use it, and neither wants `5k`
// to quietly mean five thousand. Shorthand is a thing about TYPING INTO THIS GRID, so it is
// applied at the cells that take it and nowhere else.

import type { ColumnId } from '../../lib/keyboard'

/** `k`, `l` and `cr` — thousand, lakh, crore. The whole alphabet a money cell allows.
 *
 * `c` on its own is a `cr` half typed, and it multiplies by one: somebody two keystrokes into
 * `5cr` has not yet said crore, and reading it as crore would make the cell worth five crore for
 * as long as they took to press the r — and worth five crore for good if they stopped there or
 * meant something else. An in-progress suffix means the number stands alone. */
const MULTIPLIER: Record<string, number> = {
  k: 1_000,
  l: 1_00_000,
  cr: 1_00_00_000,
  c: 1,
}

/** The shape of a money entry at any point while it is being typed: an optional minus, digits
 * around at most one point, and at most one suffix at the end. Anchored at both ends, so a letter
 * anywhere but the tail fails — `5k5` is not five thousand and five. */
const MONEY = /^(-?\d*\.?\d*)(k|l|cr|c)?$/i

/** The same without the letters. A count is a count. */
const COUNT = /^-?\d*\.?\d*$/

/** THE COLUMNS WHERE A LETTER MEANS A MULTIPLIER.
 *
 * `amount` is here and the specification does not name it — it names Price and Discount. It is a
 * money cell that works the price backwards, so refusing `5k` in Amount while taking it in Price
 * one column along is the kind of inconsistency that gets reported as a bug. Chosen, not ruled;
 * taking it out is deleting one line. */
const MONEY_COLUMNS: readonly ColumnId[] = ['price', 'amount', 'discount']

/** Cells that hold a count of things rather than a sum of money. */
const COUNT_COLUMNS: readonly ColumnId[] = ['quantity', 'freeQuantity']

/**
 * Whether a cell will let this text stand, checked on every keystroke rather than on blur.
 *
 * ON BLUR IS TOO LATE AND THE SPECIFICATION SAYS SO: a cell that accepts a letter, shows it, and
 * then silently discards it has already lied about what it holds. Refusing as it is typed means
 * the wrong key simply does nothing, which is what every numeric field a person has used does.
 *
 * A LEADING MINUS IS ALLOWED ON A COUNT, and the specification's sentence about Quantity —
 * "digits and a decimal point and nothing else" — sits inside the paragraph about LETTERS and is
 * read as being about letters. `EditableCell` was written to hold a bare "-" on the way to -4,
 * says so in its own header, and taking that out here would be removing a capability nobody asked
 * to lose. Flagged rather than assumed.
 */
export function acceptsTyped(column: ColumnId, typed: string): boolean {
  if (MONEY_COLUMNS.includes(column)) return MONEY.test(typed)
  if (COUNT_COLUMNS.includes(column)) return COUNT.test(typed)
  // Unit and item name are words. They have to be able to contain k, l and cr.
  return true
}

/**
 * `5k` becomes `5000`, `5l` becomes `500000`, `5cr` becomes `50000000`. Everything else comes
 * back exactly as it went in.
 *
 * IT RETURNS A STRING because the thing downstream of it is `toPaise`, which is where a rupee
 * figure becomes whole paise and where the ceiling on what the arithmetic can hold is enforced.
 * Returning a number here would mean two places deciding what a hundred crore is.
 *
 * TEXT WITH NO SUFFIX IS HANDED BACK UNTOUCHED rather than parsed and re-printed. A cell holding
 * "12." on the way to "12.50" has to survive this, and so does a bare "-".
 */
export function expandShorthand(typed: string): string {
  const found = MONEY.exec(typed)
  if (found === null) return typed

  const [, digits = '', suffix] = found
  if (suffix === undefined) return typed

  const value = Number(digits)
  // A suffix with nothing in front of it — "k", "-cr". There is no number to multiply, so it goes
  // downstream unchanged and is worth nothing, which is what it says.
  if (digits === '' || !Number.isFinite(value)) return typed

  return String(value * (MULTIPLIER[suffix.toLowerCase()] ?? 1))
}
