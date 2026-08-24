// How wide each column of the charges table is.
//
// Its own file for the same reason cellContent.ts is: the heading row and the row itself both
// need it, and having them read it from each other is a circle — which the import-cycle gate
// caught the moment it was tried, exactly as it did the first time.
//
// ONE LIST, because they were declared twice and drifted: the heading and the row disagreed by
// one class, so a column compressed on a narrow screen and everything below it slid left of its
// heading.
//
// FOUR COLUMNS, NOT FIVE. It carried the item grid's leading gutter so the two tables would
// line up down the left edge — but the item grid's gutter holds the ROW NUMBER, and a charge
// has no number: it held nothing but a delete control that appears on hover. So a whole column
// of empty sat at the front of the charges table for the sake of an alignment nobody reads
// across, on two tables that are not even the same width. v2 has four columns and puts the
// delete inside the amount cell, which is where the row ends and where the eye already is.

// THE NAME COLUMN IS THE FLEXIBLE ONE, and the amount is fixed — the item grid does the same
// with Item against Amount, for the same reason. Fixed everywhere except the amount meant the
// table could not fit its half of the footer at all: the columns added up to more than the
// space and the card overflowed under the tax summary beside it.
export const SUNDRY_WIDTHS = {
  name: 'min-w-0 flex-1',
  type: 'w-20 shrink-0',
  value: 'w-24 shrink-0',
  amount: 'w-32 shrink-0',
} as const
